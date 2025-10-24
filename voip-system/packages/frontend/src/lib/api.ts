const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Note: Shared types will be imported when the shared package is built

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as any).Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
          // Clear token and redirect to login
          this.clearToken();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || data.error?.code || JSON.stringify(data.error) || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async health(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Tenants
  async getTenants(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/tenants?${query.toString()}`);
  }

  async getTenant(id: string) {
    return this.request(`/tenants/${id}`);
  }

  async createTenant(data: { name: string; domain: string; edg_suite_id: string }) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTenant(id: string, data: Partial<{ name: string; domain: string; edg_suite_id: string }>) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTenant(id: string) {
    return this.request(`/tenants/${id}`, {
      method: 'DELETE',
    });
  }

  // Stores
  async getStores(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/stores?${query.toString()}`);
  }

  async getStore(id: string) {
    return this.request(`/stores/${id}`);
  }

  async createStore(data: { name: string; store_id: string; sip_trunk_settings?: any }) {
    return this.request('/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStore(id: string, data: Partial<{ name: string; store_id: string; sip_trunk_settings?: any }>) {
    return this.request(`/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(id: string) {
    return this.request(`/stores/${id}`, {
      method: 'DELETE',
    });
  }

  // VoIP Entities - Extensions
  async getExtensions(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/sip-extensions?${query.toString()}`);
  }

  async createW3Extension(data: { ext_number: string; display_name: string; enabled?: boolean; voicemail_enabled?: boolean; class_of_service?: string; note?: string; store_id?: string }) {
    return this.request('/w3-voip/extensions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - SIP Trunks
  async getSipTrunks(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/sip-trunks?${query.toString()}`);
  }

  async createW3Trunk(data: { provider: string; proxy: string; port?: number; transport?: string; auth_username: string; secret_ref: string; register?: boolean; expiry_seconds?: number; codec_set?: string; note?: string; store_id?: string }) {
    return this.request('/w3-voip/trunks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - Time Conditions
  async getTimeConditions(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/time-conditions?${query.toString()}`);
  }

  async createTimeCondition(data: { name: string; description?: string; timezone?: string; store_id?: string }) {
    return this.request('/voip/time-conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - IVR Menus
  async getIvrMenus(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/ivr-menus?${query.toString()}`);
  }

  async createIvrMenu(data: { name: string; description?: string; greeting_message?: string; store_id?: string }) {
    return this.request('/voip/ivr-menus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - Ring Groups
  async getRingGroups(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/ring-groups?${query.toString()}`);
  }

  async createRingGroup(data: { name: string; extension_number: string; description?: string; store_id?: string }) {
    return this.request('/voip/ring-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - Queues
  async getQueues(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/queues?${query.toString()}`);
  }

  async createQueue(data: { name: string; extension_number: string; description?: string; store_id?: string }) {
    return this.request('/voip/queues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - Conference Rooms
  async getConferenceRooms(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/conference-rooms?${query.toString()}`);
  }

  async createConferenceRoom(data: { name: string; extension_number: string; description?: string; store_id?: string }) {
    return this.request('/voip/conference-rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // VoIP Entities - Voicemail Boxes
  async getVoicemailBoxes(params?: { page?: number; limit?: number; store_id?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.store_id) query.append('store_id', params.store_id);
    if (params?.search) query.append('search', params.search);
    
    return this.request(`/voip/voicemail-boxes?${query.toString()}`);
  }

  async createVoicemailBox(data: { extension_number: string; password: string; display_name: string; email_address?: string; store_id?: string }) {
    return this.request('/voip/voicemail-boxes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===== W3 VOIP API METHODS =====
  
  // W3 Trunks
  async getW3Trunks(params?: { store_id?: string }) {
    const query = new URLSearchParams();
    if (params?.store_id) query.append('store_id', params.store_id);
    
    return this.request(`/w3-voip/trunks?${query.toString()}`);
  }

  async getW3Trunk(id: string) {
    return this.request(`/w3-voip/trunks/${id}`);
  }

  async updateW3Trunk(id: string, data: any) {
    return this.request(`/w3-voip/trunks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteW3Trunk(id: string) {
    return this.request(`/w3-voip/trunks/${id}`, {
      method: 'DELETE',
    });
  }

  // W3 Extensions
  async getW3Extensions(params?: { store_id?: string }) {
    const query = new URLSearchParams();
    if (params?.store_id) query.append('store_id', params.store_id);
    
    return this.request(`/w3-voip/extensions?${query.toString()}`);
  }

  async getW3Extension(id: string) {
    return this.request(`/w3-voip/extensions/${id}`);
  }

  async updateW3Extension(id: string, data: any) {
    return this.request(`/w3-voip/extensions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteW3Extension(id: string) {
    return this.request(`/w3-voip/extensions/${id}`, {
      method: 'DELETE',
    });
  }

  // W3 DIDs
  async getW3Dids(params?: { store_id?: string }) {
    const query = new URLSearchParams();
    if (params?.store_id) query.append('store_id', params.store_id);
    
    return this.request(`/w3-voip/dids?${query.toString()}`);
  }

  async createW3Did(data: { trunk_id: string; e164: string; route_target_type: string; route_target_ref: string; label: string; active?: boolean; store_id?: string }) {
    return this.request('/w3-voip/dids', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // W3 Routes
  async getW3Routes() {
    return this.request('/w3-voip/routes');
  }

  async createW3Route(data: { name: string; pattern: string; strip_digits?: number; prepend?: string; trunk_id: string; priority?: number; active?: boolean }) {
    return this.request('/w3-voip/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // W3 Contact Policies
  async getW3ContactPolicies() {
    return this.request('/w3-voip/contact-policies');
  }

  async createW3ContactPolicy(data: { scope_type: string; scope_ref: string; rules_json: any; label: string; active?: boolean }) {
    return this.request('/w3-voip/contact-policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // CDR and Activity Logs
  async getCdrs(params?: { store_id?: string; start_date?: string; end_date?: string; direction?: string; disposition?: string; ext_number?: string; did_e164?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/cdr?${query.toString()}`);
  }

  async getCdrStats(params?: { store_id?: string; start_date?: string; end_date?: string }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/cdr/stats?${query.toString()}`);
  }

  async getActivityLogs(params?: { actor?: string; action?: string; target_type?: string; target_id?: string; status?: string; start_date?: string; end_date?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/activity-log?${query.toString()}`);
  }

  async getActivityStats(params?: { start_date?: string; end_date?: string }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/activity-log/stats?${query.toString()}`);
  }

  async getExtension(id: string) {
    return this.request(`/extensions/${id}`);
  }

  async createExtension(data: {
    store_id?: string;
    extension_number: string;
    password: string;
    caller_id_name?: string;
    caller_id_number?: string;
    enabled?: boolean;
  }) {
    return this.request('/extensions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExtension(id: string, data: Partial<{
    store_id?: string;
    extension_number: string;
    password: string;
    caller_id_name?: string;
    caller_id_number?: string;
    enabled?: boolean;
  }>) {
    return this.request(`/extensions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExtension(id: string) {
    return this.request(`/extensions/${id}`, {
      method: 'DELETE',
    });
  }

  // CDR
  async getCDR(params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    call_direction?: string;
    caller_number?: string;
    callee_number?: string;
  }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/cdr?${query.toString()}`);
  }

  async getCDRStats(params?: {
    start_date?: string;
    end_date?: string;
    call_direction?: string;
  }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value.toString());
    });
    
    return this.request(`/cdr-activity/cdr/stats?${query.toString()}`);
  }

  async exportCDR(format: 'csv' | 'json', params?: any) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.append(key, value.toString());
    });
    
    return this.request(`/cdr/export/${format}?${query.toString()}`);
  }

  // Calls
  async getCallStatus() {
    return this.request('/calls/status');
  }

  async originateCall(data: {
    caller_extension: string;
    callee_number: string;
    domain: string;
    options?: {
      timeout?: number;
      caller_id?: string;
      context?: string;
      recording?: boolean;
    };
  }) {
    return this.request('/calls/originate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transferCall(data: {
    call_uuid: string;
    destination: string;
    type?: 'attended' | 'blind';
  }) {
    return this.request('/calls/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async hangupCall(data: {
    call_uuid: string;
    cause?: string;
  }) {
    return this.request('/calls/hangup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async holdCall(data: {
    call_uuid: string;
    hold?: boolean;
  }) {
    return this.request('/calls/hold', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async muteCall(data: {
    call_uuid: string;
    mute?: boolean;
  }) {
    return this.request('/calls/mute', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async recordCall(data: {
    call_uuid: string;
    record?: boolean;
    path?: string;
  }) {
    return this.request('/calls/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCallInfo(callUuid: string) {
    return this.request(`/calls/info/${callUuid}`);
  }

  // ===== SUPER ADMIN & TENANT MANAGEMENT =====

  // Cross-tenant statistics
  async getCrossTenantStats() {
    return this.request('/tenants/stats');
  }

  async getTenantStatsList() {
    return this.request('/tenants/stats-list');
  }

  // Tenant management with companies, contacts and admin user
  async createTenantWithCompanies(data: {
    name: string;
    slug: string;
    domain: string;
    sip_domain: string;
    admin_user: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
      role: 'tenant_admin' | 'super_admin';
    };
    companies: Array<{
      legal_name: string;
      vat_number?: string;
      tax_code?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      is_primary: boolean;
    }>;
    contacts: Array<{
      first_name: string;
      last_name: string;
      role?: string;
      email?: string;
      phone?: string;
      mobile?: string;
      is_primary: boolean;
    }>;
  }) {
    return this.request('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTenantWithDetails(id: string) {
    return this.request(`/tenants/${id}`);
  }

  async updateTenantWithDetails(id: string, data: any) {
    return this.request(`/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async activateTenant(id: string) {
    return this.request(`/tenants/${id}/activate`, {
      method: 'POST',
    });
  }

  async suspendTenant(id: string) {
    return this.request(`/tenants/${id}/suspend`, {
      method: 'POST',
    });
  }

  // User impersonation
  async impersonateUser(tenantId: string, userId: string) {
    return this.request(`/tenants/${tenantId}/impersonate`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Cross-tenant analytics
  async getCrossTenantCalls(params?: {
    start_date?: string;
    end_date?: string;
    tenant_id?: string;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/analytics/cross-tenant/calls?${query.toString()}`);
  }

  async getCrossTenantExtensions() {
    return this.request('/analytics/cross-tenant/extensions');
  }

  async getCrossTenantLiveCalls() {
    return this.request('/analytics/cross-tenant/live-calls');
  }

  async getCrossTenantUsers() {
    return this.request('/analytics/cross-tenant/users');
  }

  async getCrossTenantCompanies() {
    return this.request('/analytics/cross-tenant/companies');
  }

  async getCrossTenantSummary(params?: {
    period?: '1h' | '24h' | '7d' | '30d';
  }) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined) query.append(key, value.toString());
    });
    
    return this.request(`/analytics/cross-tenant/summary?${query.toString()}`);
  }

  // Impersonation management
  private originalToken: string | null = null;

  startImpersonation(impersonationToken: string) {
    // Save original token
    this.originalToken = this.token;
    // Set impersonation token
    this.token = impersonationToken;
  }

  exitImpersonation() {
    if (this.originalToken) {
      this.token = this.originalToken;
      this.originalToken = null;
    }
  }

  isImpersonating(): boolean {
    return this.originalToken !== null;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;