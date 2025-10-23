"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.W3VoipService = void 0;
// @ts-nocheck
const uuid_1 = require("uuid");
class W3VoipService {
    constructor() {
        // Mock database - in production this would be real database operations
        this.mockTrunks = [];
        this.mockDids = [];
        this.mockExtensions = [];
        this.mockRoutes = [];
        this.mockPolicies = [];
    }
    // ===== VOIP TRUNKS =====
    async createTrunk(tenantContext, data) {
        const trunk = {
            id: (0, uuid_1.v4)(),
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
    async getTrunks(tenantId, storeId) {
        return this.mockTrunks.filter(trunk => trunk.tenant_id === tenantId &&
            (!storeId || trunk.store_id === storeId));
    }
    async getTrunkById(trunkId, tenantId) {
        return this.mockTrunks.find(trunk => trunk.id === trunkId && trunk.tenant_id === tenantId) || null;
    }
    async updateTrunk(trunkId, tenantId, data) {
        const trunkIndex = this.mockTrunks.findIndex(trunk => trunk.id === trunkId && trunk.tenant_id === tenantId);
        if (trunkIndex === -1)
            return null;
        this.mockTrunks[trunkIndex] = {
            ...this.mockTrunks[trunkIndex],
            ...data,
            id: trunkId, // Ensure ID doesn't change
            tenant_id: tenantId // Ensure tenant_id doesn't change
        };
        return this.mockTrunks[trunkIndex];
    }
    async deleteTrunk(trunkId, tenantId) {
        const trunkIndex = this.mockTrunks.findIndex(trunk => trunk.id === trunkId && trunk.tenant_id === tenantId);
        if (trunkIndex === -1)
            return false;
        this.mockTrunks.splice(trunkIndex, 1);
        return true;
    }
    // ===== VOIP DIDS =====
    async createDid(tenantContext, data) {
        const did = {
            id: (0, uuid_1.v4)(),
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
    async getDids(tenantId, storeId) {
        return this.mockDids.filter(did => did.tenant_id === tenantId &&
            (!storeId || did.store_id === storeId));
    }
    async getDidById(didId, tenantId) {
        return this.mockDids.find(did => did.id === didId && did.tenant_id === tenantId) || null;
    }
    async updateDid(didId, tenantId, data) {
        const didIndex = this.mockDids.findIndex(did => did.id === didId && did.tenant_id === tenantId);
        if (didIndex === -1)
            return null;
        this.mockDids[didIndex] = {
            ...this.mockDids[didIndex],
            ...data,
            id: didId,
            tenant_id: tenantId
        };
        return this.mockDids[didIndex];
    }
    async deleteDid(didId, tenantId) {
        const didIndex = this.mockDids.findIndex(did => did.id === didId && did.tenant_id === tenantId);
        if (didIndex === -1)
            return false;
        this.mockDids.splice(didIndex, 1);
        return true;
    }
    // ===== VOIP EXTENSIONS =====
    async createExtension(tenantContext, data) {
        const extension = {
            id: (0, uuid_1.v4)(),
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
    async getExtensions(tenantId, storeId) {
        return this.mockExtensions.filter(extension => extension.tenant_id === tenantId &&
            (!storeId || extension.store_id === storeId));
    }
    async getExtensionById(extensionId, tenantId) {
        return this.mockExtensions.find(extension => extension.id === extensionId && extension.tenant_id === tenantId) || null;
    }
    async updateExtension(extensionId, tenantId, data) {
        const extensionIndex = this.mockExtensions.findIndex(extension => extension.id === extensionId && extension.tenant_id === tenantId);
        if (extensionIndex === -1)
            return null;
        this.mockExtensions[extensionIndex] = {
            ...this.mockExtensions[extensionIndex],
            ...data,
            id: extensionId,
            tenant_id: tenantId
        };
        return this.mockExtensions[extensionIndex];
    }
    async deleteExtension(extensionId, tenantId) {
        const extensionIndex = this.mockExtensions.findIndex(extension => extension.id === extensionId && extension.tenant_id === tenantId);
        if (extensionIndex === -1)
            return false;
        this.mockExtensions.splice(extensionIndex, 1);
        return true;
    }
    // ===== VOIP ROUTES =====
    async createRoute(tenantContext, data) {
        const route = {
            id: (0, uuid_1.v4)(),
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
    async getRoutes(tenantId) {
        return this.mockRoutes.filter(route => route.tenant_id === tenantId);
    }
    async getRouteById(routeId, tenantId) {
        return this.mockRoutes.find(route => route.id === routeId && route.tenant_id === tenantId) || null;
    }
    async updateRoute(routeId, tenantId, data) {
        const routeIndex = this.mockRoutes.findIndex(route => route.id === routeId && route.tenant_id === tenantId);
        if (routeIndex === -1)
            return null;
        this.mockRoutes[routeIndex] = {
            ...this.mockRoutes[routeIndex],
            ...data,
            id: routeId,
            tenant_id: tenantId
        };
        return this.mockRoutes[routeIndex];
    }
    async deleteRoute(routeId, tenantId) {
        const routeIndex = this.mockRoutes.findIndex(route => route.id === routeId && route.tenant_id === tenantId);
        if (routeIndex === -1)
            return false;
        this.mockRoutes.splice(routeIndex, 1);
        return true;
    }
    // ===== CONTACT POLICIES =====
    async createContactPolicy(tenantContext, data) {
        const policy = {
            id: (0, uuid_1.v4)(),
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
    async getContactPolicies(tenantId) {
        return this.mockPolicies.filter(policy => policy.tenant_id === tenantId);
    }
    async getContactPolicyById(policyId, tenantId) {
        return this.mockPolicies.find(policy => policy.id === policyId && policy.tenant_id === tenantId) || null;
    }
    async updateContactPolicy(policyId, tenantId, data) {
        const policyIndex = this.mockPolicies.findIndex(policy => policy.id === policyId && policy.tenant_id === tenantId);
        if (policyIndex === -1)
            return null;
        this.mockPolicies[policyIndex] = {
            ...this.mockPolicies[policyIndex],
            ...data,
            id: policyId,
            tenant_id: tenantId
        };
        return this.mockPolicies[policyIndex];
    }
    async deleteContactPolicy(policyId, tenantId) {
        const policyIndex = this.mockPolicies.findIndex(policy => policy.id === policyId && policy.tenant_id === tenantId);
        if (policyIndex === -1)
            return false;
        this.mockPolicies.splice(policyIndex, 1);
        return true;
    }
    // ===== UTILITY METHODS =====
    async getTrunkStatus(trunkId, tenantId) {
        const trunk = await this.getTrunkById(trunkId, tenantId);
        return trunk?.status || 'UNKNOWN';
    }
    async updateTrunkStatus(trunkId, tenantId, status) {
        const trunk = await this.getTrunkById(trunkId, tenantId);
        if (!trunk)
            return false;
        trunk.status = status;
        return true;
    }
    async getExtensionsByStore(tenantId, storeId) {
        return this.mockExtensions.filter(extension => extension.tenant_id === tenantId && extension.store_id === storeId);
    }
    async getDidsByTrunk(tenantId, trunkId) {
        return this.mockDids.filter(did => did.tenant_id === tenantId && did.trunk_id === trunkId);
    }
}
exports.W3VoipService = W3VoipService;
//# sourceMappingURL=w3-voip-service.js.map