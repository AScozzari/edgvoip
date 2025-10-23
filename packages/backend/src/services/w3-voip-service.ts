// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
// import { 
//   VoipTrunk, 
//   VoipDid, 
//   VoipExtension, 
//   VoipRoute, 
//   ContactPolicy,
//   CreateTrunkRequest,
//   CreateDidRequest,
//   CreateExtensionRequest,
//   CreateRouteRequest,
//   CreateContactPolicyRequest
// } from '@w3-voip/shared';

// Define types locally
export interface VoipTrunk {
  id: string;
  tenant_id: string;
  name: string;
  provider: string;
  host: string;
  port: number;
  transport: 'udp' | 'tcp' | 'tls';
  username: string;
  password: string;
  status: 'active' | 'inactive' | 'testing';
  created_at: Date;
  updated_at: Date;
}

export interface VoipDid {
  id: string;
  tenant_id: string;
  trunk_id: string;
  number: string;
  country_code: string;
  local_number: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface VoipExtension {
  id: string;
  tenant_id: string;
  store_id?: string;
  extension: string;
  password: string;
  display_name: string;
  status: 'active' | 'inactive';
  type: 'user' | 'queue' | 'conference';
  created_at: Date;
  updated_at: Date;
}

export interface VoipRoute {
  id: string;
  tenant_id: string;
  name: string;
  pattern: string;
  destination: string;
  priority: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ContactPolicy {
  id: string;
  tenant_id: string;
  name: string;
  rules: any[];
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTrunkRequest {
  name: string;
  provider: string;
  host: string;
  port: number;
  transport: 'udp' | 'tcp' | 'tls';
  username: string;
  password: string;
}

export interface CreateDidRequest {
  trunk_id: string;
  number: string;
  country_code: string;
  local_number: string;
}

export interface CreateExtensionRequest {
  extension: string;
  password: string;
  display_name: string;
  type: 'user' | 'queue' | 'conference';
}

export interface CreateRouteRequest {
  name: string;
  pattern: string;
  destination: string;
  priority: number;
}

export interface CreateContactPolicyRequest {
  name: string;
  rules: any[];
}

export interface TenantContext {
  tenant_id: string;
  sip_domain: string;
  store_id?: string;
}

export class W3VoipService {
  // Mock database - in production this would be real database operations
  private mockTrunks: VoipTrunk[] = [];
  private mockDids: VoipDid[] = [];
  private mockExtensions: VoipExtension[] = [];
  private mockRoutes: VoipRoute[] = [];
  private mockPolicies: ContactPolicy[] = [];

  // ===== VOIP TRUNKS =====
  async createTrunk(tenantContext: TenantContext, data: CreateTrunkRequest): Promise<VoipTrunk> {
    const trunk: VoipTrunk = {
      id: uuidv4(),
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id,
      sip_domain: tenantContext.sip_domain,
      provider: data.provider,
      proxy: data.proxy,
      port: data.port,
      transport: data.transport,
      auth_username: data.auth_username,
      secret_ref: data.secret_ref,
      register: data.register,
      expiry_seconds: data.expiry_seconds,
      codec_set: data.codec_set,
      status: 'UNKNOWN',
      note: data.note
    };

    this.mockTrunks.push(trunk);
    console.log(`Created trunk: ${trunk.id} for tenant: ${tenantContext.tenant_id}`);
    return trunk;
  }

  async getTrunks(tenantId: string, storeId?: string): Promise<VoipTrunk[]> {
    return this.mockTrunks.filter(trunk => 
      trunk.tenant_id === tenantId && 
      (!storeId || trunk.store_id === storeId)
    );
  }

  async getTrunkById(trunkId: string, tenantId: string): Promise<VoipTrunk | null> {
    return this.mockTrunks.find(trunk => 
      trunk.id === trunkId && trunk.tenant_id === tenantId
    ) || null;
  }

  async updateTrunk(trunkId: string, tenantId: string, data: Partial<CreateTrunkRequest>): Promise<VoipTrunk | null> {
    const trunkIndex = this.mockTrunks.findIndex(trunk => 
      trunk.id === trunkId && trunk.tenant_id === tenantId
    );

    if (trunkIndex === -1) return null;

    this.mockTrunks[trunkIndex] = {
      ...this.mockTrunks[trunkIndex],
      ...data,
      id: trunkId, // Ensure ID doesn't change
      tenant_id: tenantId // Ensure tenant_id doesn't change
    };

    return this.mockTrunks[trunkIndex];
  }

  async deleteTrunk(trunkId: string, tenantId: string): Promise<boolean> {
    const trunkIndex = this.mockTrunks.findIndex(trunk => 
      trunk.id === trunkId && trunk.tenant_id === tenantId
    );

    if (trunkIndex === -1) return false;

    this.mockTrunks.splice(trunkIndex, 1);
    return true;
  }

  // ===== VOIP DIDS =====
  async createDid(tenantContext: TenantContext, data: CreateDidRequest): Promise<VoipDid> {
    const did: VoipDid = {
      id: uuidv4(),
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id,
      trunk_id: data.trunk_id,
      e164: data.e164,
      sip_domain: tenantContext.sip_domain,
      route_target_type: data.route_target_type,
      route_target_ref: data.route_target_ref,
      label: data.label,
      active: data.active
    };

    this.mockDids.push(did);
    console.log(`Created DID: ${did.e164} for tenant: ${tenantContext.tenant_id}`);
    return did;
  }

  async getDids(tenantId: string, storeId?: string): Promise<VoipDid[]> {
    return this.mockDids.filter(did => 
      did.tenant_id === tenantId && 
      (!storeId || did.store_id === storeId)
    );
  }

  async getDidById(didId: string, tenantId: string): Promise<VoipDid | null> {
    return this.mockDids.find(did => 
      did.id === didId && did.tenant_id === tenantId
    ) || null;
  }

  async updateDid(didId: string, tenantId: string, data: Partial<CreateDidRequest>): Promise<VoipDid | null> {
    const didIndex = this.mockDids.findIndex(did => 
      did.id === didId && did.tenant_id === tenantId
    );

    if (didIndex === -1) return null;

    this.mockDids[didIndex] = {
      ...this.mockDids[didIndex],
      ...data,
      id: didId,
      tenant_id: tenantId
    };

    return this.mockDids[didIndex];
  }

  async deleteDid(didId: string, tenantId: string): Promise<boolean> {
    const didIndex = this.mockDids.findIndex(did => 
      did.id === didId && did.tenant_id === tenantId
    );

    if (didIndex === -1) return false;

    this.mockDids.splice(didIndex, 1);
    return true;
  }

  // ===== VOIP EXTENSIONS =====
  async createExtension(tenantContext: TenantContext, data: CreateExtensionRequest): Promise<VoipExtension> {
    const extension: VoipExtension = {
      id: uuidv4(),
      tenant_id: tenantContext.tenant_id,
      store_id: tenantContext.store_id,
      sip_domain: tenantContext.sip_domain,
      ext_number: data.ext_number,
      display_name: data.display_name,
      enabled: data.enabled,
      voicemail_enabled: data.voicemail_enabled,
      forward_rules: data.forward_rules,
      class_of_service: data.class_of_service,
      note: data.note
    };

    this.mockExtensions.push(extension);
    console.log(`Created extension: ${extension.ext_number} for tenant: ${tenantContext.tenant_id}`);
    return extension;
  }

  async getExtensions(tenantId: string, storeId?: string): Promise<VoipExtension[]> {
    return this.mockExtensions.filter(extension => 
      extension.tenant_id === tenantId && 
      (!storeId || extension.store_id === storeId)
    );
  }

  async getExtensionById(extensionId: string, tenantId: string): Promise<VoipExtension | null> {
    return this.mockExtensions.find(extension => 
      extension.id === extensionId && extension.tenant_id === tenantId
    ) || null;
  }

  async updateExtension(extensionId: string, tenantId: string, data: Partial<CreateExtensionRequest>): Promise<VoipExtension | null> {
    const extensionIndex = this.mockExtensions.findIndex(extension => 
      extension.id === extensionId && extension.tenant_id === tenantId
    );

    if (extensionIndex === -1) return null;

    this.mockExtensions[extensionIndex] = {
      ...this.mockExtensions[extensionIndex],
      ...data,
      id: extensionId,
      tenant_id: tenantId
    };

    return this.mockExtensions[extensionIndex];
  }

  async deleteExtension(extensionId: string, tenantId: string): Promise<boolean> {
    const extensionIndex = this.mockExtensions.findIndex(extension => 
      extension.id === extensionId && extension.tenant_id === tenantId
    );

    if (extensionIndex === -1) return false;

    this.mockExtensions.splice(extensionIndex, 1);
    return true;
  }

  // ===== VOIP ROUTES =====
  async createRoute(tenantContext: TenantContext, data: CreateRouteRequest): Promise<VoipRoute> {
    const route: VoipRoute = {
      id: uuidv4(),
      tenant_id: tenantContext.tenant_id,
      name: data.name,
      pattern: data.pattern,
      strip_digits: data.strip_digits,
      prepend: data.prepend,
      trunk_id: data.trunk_id,
      priority: data.priority,
      active: data.active
    };

    this.mockRoutes.push(route);
    console.log(`Created route: ${route.name} for tenant: ${tenantContext.tenant_id}`);
    return route;
  }

  async getRoutes(tenantId: string): Promise<VoipRoute[]> {
    return this.mockRoutes.filter(route => route.tenant_id === tenantId);
  }

  async getRouteById(routeId: string, tenantId: string): Promise<VoipRoute | null> {
    return this.mockRoutes.find(route => 
      route.id === routeId && route.tenant_id === tenantId
    ) || null;
  }

  async updateRoute(routeId: string, tenantId: string, data: Partial<CreateRouteRequest>): Promise<VoipRoute | null> {
    const routeIndex = this.mockRoutes.findIndex(route => 
      route.id === routeId && route.tenant_id === tenantId
    );

    if (routeIndex === -1) return null;

    this.mockRoutes[routeIndex] = {
      ...this.mockRoutes[routeIndex],
      ...data,
      id: routeId,
      tenant_id: tenantId
    };

    return this.mockRoutes[routeIndex];
  }

  async deleteRoute(routeId: string, tenantId: string): Promise<boolean> {
    const routeIndex = this.mockRoutes.findIndex(route => 
      route.id === routeId && route.tenant_id === tenantId
    );

    if (routeIndex === -1) return false;

    this.mockRoutes.splice(routeIndex, 1);
    return true;
  }

  // ===== CONTACT POLICIES =====
  async createContactPolicy(tenantContext: TenantContext, data: CreateContactPolicyRequest): Promise<ContactPolicy> {
    const policy: ContactPolicy = {
      id: uuidv4(),
      tenant_id: tenantContext.tenant_id,
      scope_type: data.scope_type,
      scope_ref: data.scope_ref,
      rules_json: data.rules_json,
      active: data.active,
      label: data.label
    };

    this.mockPolicies.push(policy);
    console.log(`Created contact policy: ${policy.label} for tenant: ${tenantContext.tenant_id}`);
    return policy;
  }

  async getContactPolicies(tenantId: string): Promise<ContactPolicy[]> {
    return this.mockPolicies.filter(policy => policy.tenant_id === tenantId);
  }

  async getContactPolicyById(policyId: string, tenantId: string): Promise<ContactPolicy | null> {
    return this.mockPolicies.find(policy => 
      policy.id === policyId && policy.tenant_id === tenantId
    ) || null;
  }

  async updateContactPolicy(policyId: string, tenantId: string, data: Partial<CreateContactPolicyRequest>): Promise<ContactPolicy | null> {
    const policyIndex = this.mockPolicies.findIndex(policy => 
      policy.id === policyId && policy.tenant_id === tenantId
    );

    if (policyIndex === -1) return null;

    this.mockPolicies[policyIndex] = {
      ...this.mockPolicies[policyIndex],
      ...data,
      id: policyId,
      tenant_id: tenantId
    };

    return this.mockPolicies[policyIndex];
  }

  async deleteContactPolicy(policyId: string, tenantId: string): Promise<boolean> {
    const policyIndex = this.mockPolicies.findIndex(policy => 
      policy.id === policyId && policy.tenant_id === tenantId
    );

    if (policyIndex === -1) return false;

    this.mockPolicies.splice(policyIndex, 1);
    return true;
  }

  // ===== UTILITY METHODS =====
  async getTrunkStatus(trunkId: string, tenantId: string): Promise<'REG_OK' | 'FAIL' | 'UNKNOWN'> {
    const trunk = await this.getTrunkById(trunkId, tenantId);
    return trunk?.status || 'UNKNOWN';
  }

  async updateTrunkStatus(trunkId: string, tenantId: string, status: 'REG_OK' | 'FAIL' | 'UNKNOWN'): Promise<boolean> {
    const trunk = await this.getTrunkById(trunkId, tenantId);
    if (!trunk) return false;

    trunk.status = status;
    return true;
  }

  async getExtensionsByStore(tenantId: string, storeId: string): Promise<VoipExtension[]> {
    return this.mockExtensions.filter(extension => 
      extension.tenant_id === tenantId && extension.store_id === storeId
    );
  }

  async getDidsByTrunk(tenantId: string, trunkId: string): Promise<VoipDid[]> {
    return this.mockDids.filter(did => 
      did.tenant_id === tenantId && did.trunk_id === trunkId
    );
  }
}
