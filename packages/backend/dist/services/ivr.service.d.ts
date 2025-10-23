export interface IvrMenu {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    extension: string;
    greeting_sound?: string;
    invalid_sound?: string;
    exit_sound?: string;
    timeout: number;
    max_failures: number;
    timeout_action: {
        type: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'repeat';
        destination: string;
        timeout?: number;
    };
    invalid_action: {
        type: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'repeat';
        destination: string;
        timeout?: number;
    };
    options: {
        [key: string]: {
            action: 'extension' | 'voicemail' | 'queue' | 'hangup' | 'submenu' | 'conference';
            destination: string;
            description?: string;
        };
    };
    enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare class IvrService {
    private mapRowToIvrMenu;
    createIvrMenu(ivrMenuData: Omit<IvrMenu, 'id' | 'created_at' | 'updated_at'>): Promise<IvrMenu>;
    getIvrMenuById(id: string, tenantId: string): Promise<IvrMenu | undefined>;
    getIvrMenuByExtension(extension: string, tenantId: string): Promise<IvrMenu | undefined>;
    listIvrMenus(tenantId: string): Promise<IvrMenu[]>;
    updateIvrMenu(id: string, tenantId: string, updateData: Partial<Omit<IvrMenu, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>): Promise<IvrMenu | undefined>;
    deleteIvrMenu(id: string, tenantId: string): Promise<boolean>;
    validateIvrMenu(ivrMenu: Partial<IvrMenu>): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getActiveIvrMenus(tenantId: string): Promise<IvrMenu[]>;
    processDtmfInput(ivrMenuId: string, tenantId: string, dtmf: string): Promise<{
        action: any;
        nextMenu?: IvrMenu;
    }>;
    generateFreeSwitchXml(ivrMenu: IvrMenu): Promise<string>;
    private getActionDestination;
}
//# sourceMappingURL=ivr.service.d.ts.map