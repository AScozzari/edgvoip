/**
 * E2E Test: Multi-Tenant Flow
 * 
 * Tests complete multi-tenant functionality:
 * 1. Create tenant
 * 2. Auto-generate contexts
 * 3. Create extension
 * 4. Create trunk
 * 5. Create inbound/outbound routes
 * 6. Deploy FreeSWITCH config
 * 7. Verify files generated
 */

import { TenantService } from '../../src/services/tenant.service';
import { DialplanRulesService } from '../../src/services/dialplan-rules.service';
import { RoutingService } from '../../src/services/routing.service';
import { FreeSWITCHConfigService } from '../../src/services/freeswitch-config.service';
import { FreeSWITCHDeployService } from '../../src/services/freeswitch-deploy.service';
import { getClient } from '@w3-voip/database';
import { v4 as uuidv4 } from 'uuid';

describe('Multi-Tenant Flow E2E Test', () => {
  let tenantService: TenantService;
  let dialplanRulesService: DialplanRulesService;
  let routingService: RoutingService;
  let freeswitchConfigService: FreeSWITCHConfigService;
  let freeswitchDeployService: FreeSWITCHDeployService;
  
  let testTenantId: string;
  let testExtensionId: string;
  let testTrunkId: string;

  beforeAll(() => {
    tenantService = new TenantService();
    dialplanRulesService = new DialplanRulesService();
    routingService = new RoutingService();
    freeswitchConfigService = new FreeSWITCHConfigService();
    freeswitchDeployService = new FreeSWITCHDeployService();
  });

  describe('1. Create Tenant', () => {
    it('should create a new tenant with auto-generated fields', async () => {
      const tenant = await tenantService.createTenant({
        name: 'Test Tenant E2E',
        slug: 'test-e2e',
        domain: 'test-e2e',
        sip_domain: 'test-e2e.edgvoip.it',
        context_prefix: 'tenant-test-e2e',
        parent_tenant_id: null,
        is_master: false,
        timezone: 'Europe/Rome',
        language: 'it',
        status: 'active',
        settings: {
          max_extensions: 50,
          max_trunks: 5,
          max_concurrent_calls: 10,
          recording_enabled: true,
          voicemail_directory: '/var/lib/freeswitch/storage/test-e2e/voicemail'
        }
      });

      expect(tenant).toBeDefined();
      expect(tenant.slug).toBe('test-e2e');
      expect(tenant.sip_domain).toBe('test-e2e.edgvoip.it');
      expect(tenant.context_prefix).toBe('tenant-test-e2e');
      expect(tenant.is_master).toBe(false);

      testTenantId = tenant.id;
    });
  });

  describe('2. Auto-Generate Contexts', () => {
    it('should create 6 default contexts for tenant', async () => {
      await tenantService.createTenantContexts(testTenantId);

      const contexts = [
        'tenant-test-e2e-internal',
        'tenant-test-e2e-outbound',
        'tenant-test-e2e-external',
        'tenant-test-e2e-features',
        'tenant-test-e2e-voicemail',
        'tenant-test-e2e-emergency'
      ];

      for (const context of contexts) {
        const rules = await dialplanRulesService.getRulesByContext(testTenantId, context);
        expect(rules.length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Create Extension', () => {
    it('should create an extension with all fields', async () => {
      const client = await getClient();
      
      try {
        const extensionId = uuidv4();
        
        const result = await client.query(`
          INSERT INTO extensions (
            id, tenant_id, extension, password, display_name, status,
            context, caller_id_number, voicemail_pin, pickup_group, limit_max
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          extensionId,
          testTenantId,
          '1000',
          'test_password',
          'Test Extension',
          'active',
          'tenant-test-e2e-internal',
          '1000',
          '1000',
          'sales',
          3
        ]);

        expect(result.rows[0]).toBeDefined();
        expect(result.rows[0].context).toBe('tenant-test-e2e-internal');
        
        testExtensionId = extensionId;
      } finally {
        await client.release();
      }
    });
  });

  describe('4. Create Trunk', () => {
    it('should create a SIP trunk with routing fields', async () => {
      const client = await getClient();
      
      try {
        const trunkId = uuidv4();
        
        const result = await client.query(`
          INSERT INTO sip_trunks (
            id, tenant_id, name, provider, status, sip_config, did_config,
            outbound_caller_id, inbound_dids, max_concurrent_calls, codec_prefs
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `, [
          trunkId,
          testTenantId,
          'Test Trunk',
          'Test Provider',
          'testing',
          JSON.stringify({ host: 'sip.test.com', port: 5060, username: 'test', password: 'test' }),
          JSON.stringify({ main_number: '0591111111' }),
          '0591111111',
          ['0591111111', '0591111112'],
          10,
          'PCMA,OPUS,G729'
        ]);

        expect(result.rows[0]).toBeDefined();
        expect(result.rows[0].outbound_caller_id).toBe('0591111111');
        expect(result.rows[0].inbound_dids).toContain('0591111111');
        
        testTrunkId = trunkId;
      } finally {
        await client.release();
      }
    });
  });

  describe('5. Create Routing Rules', () => {
    it('should create inbound route', async () => {
      const route = await routingService.createInboundRoute({
        tenant_id: testTenantId,
        name: 'Test Inbound Route',
        did_number: '0591111111',
        destination_type: 'extension',
        destination_value: '1000',
        enabled: true
      });

      expect(route).toBeDefined();
      expect(route.did_number).toBe('0591111111');
      expect(route.destination_value).toBe('1000');
    });

    it('should create outbound route', async () => {
      const route = await routingService.createOutboundRoute({
        tenant_id: testTenantId,
        name: 'Test Outbound Route',
        dial_pattern: '^3[0-9]{9}$',
        trunk_id: testTrunkId,
        strip_digits: 0,
        priority: 100,
        enabled: true
      });

      expect(route).toBeDefined();
      expect(route.dial_pattern).toBe('^3[0-9]{9}$');
      expect(route.trunk_id).toBe(testTrunkId);
    });

    it('should create time condition', async () => {
      const condition = await routingService.createTimeCondition({
        tenant_id: testTenantId,
        name: 'Test Office Hours',
        timezone: 'Europe/Rome',
        business_hours: {
          monday: { enabled: true, start_time: '09:00', end_time: '18:00' }
        },
        holidays: [],
        business_hours_action: 'continue',
        after_hours_action: 'voicemail',
        holiday_action: 'voicemail',
        enabled: true
      });

      expect(condition).toBeDefined();
      expect(condition.name).toBe('Test Office Hours');
    });
  });

  describe('6. Generate FreeSWITCH Config', () => {
    it('should generate tenant contexts XML', async () => {
      const tenant = await tenantService.getTenantById(testTenantId);
      const contextsXML = await freeswitchConfigService.generateTenantContexts(tenant!);

      expect(contextsXML).toContain('tenant-test-e2e-internal');
      expect(contextsXML).toContain('tenant-test-e2e-outbound');
      expect(contextsXML).toContain('tenant-test-e2e-external');
      expect(contextsXML).toContain('test-e2e.edgvoip.it');
    });

    it('should generate extension XML', async () => {
      const client = await getClient();
      
      try {
        const extResult = await client.query('SELECT * FROM extensions WHERE id = $1', [testExtensionId]);
        const tenant = await tenantService.getTenantById(testTenantId);
        
        const extensionXML = await freeswitchConfigService.generateExtensionXML(
          extResult.rows[0],
          tenant!
        );

        expect(extensionXML).toContain('id="1000"');
        expect(extensionXML).toContain('tenant-test-e2e-internal');
        expect(extensionXML).toContain('test-e2e.edgvoip.it');
      } finally {
        await client.release();
      }
    });

    it('should generate trunk gateway XML', async () => {
      const client = await getClient();
      
      try {
        const trunkResult = await client.query('SELECT * FROM sip_trunks WHERE id = $1', [testTrunkId]);
        const tenant = await tenantService.getTenantById(testTenantId);
        
        const trunkXML = await freeswitchConfigService.generateTrunkGatewayXML(
          trunkResult.rows[0],
          tenant!
        );

        expect(trunkXML).toContain('name="test_trunk"');
        expect(trunkXML).toContain('tenant-test-e2e-external');
      } finally {
        await client.release();
      }
    });
  });

  describe('7. Pattern Testing', () => {
    it('should validate regex patterns', () => {
      expect(dialplanRulesService.validatePattern('^(1\\d{3})$')).toBe(true);
      expect(dialplanRulesService.validatePattern('^3[0-9]{9}$')).toBe(true);
      expect(dialplanRulesService.validatePattern('[invalid')).toBe(false);
    });

    it('should test pattern matching', () => {
      const result1 = dialplanRulesService.testPattern('^(1\\d{3})$', '1001');
      expect(result1.match).toBe(true);
      expect(result1.groups).toEqual(['1001']);

      const result2 = dialplanRulesService.testPattern('^3[0-9]{9}$', '3297626144');
      expect(result2.match).toBe(true);

      const result3 = dialplanRulesService.testPattern('^3[0-9]{9}$', '0591234567');
      expect(result3.match).toBe(false);
    });
  });

  describe('8. Cleanup', () => {
    it('should cleanup test data', async () => {
      const client = await getClient();
      
      try {
        // Delete in correct order (FK constraints)
        await client.query('DELETE FROM inbound_routes WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM outbound_routes WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM time_conditions WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM dialplan_rules WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM extensions WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM sip_trunks WHERE tenant_id = $1', [testTenantId]);
        await client.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);

        console.log('✅ Test data cleaned up');
      } finally {
        await client.release();
      }
    });
  });
});

