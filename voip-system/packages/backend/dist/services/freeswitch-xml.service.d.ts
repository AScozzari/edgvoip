export interface FreeSwitchXmlParams {
    section?: string;
    tag_name?: string;
    key_name?: string;
    key_value?: string;
    user?: string;
    domain?: string;
    action?: string;
    'Event-Name'?: string;
    [key: string]: string | undefined;
}
export declare class FreeSwitchXmlService {
    /**
     * Genera XML per user registration/authentication
     */
    generateUserXml(extension: any, tenant: any): Promise<string>;
    /**
     * Genera XML per dialplan
     */
    generateDialplanXml(tenant: any, extensionNumber?: string): Promise<string>;
    /**
     * Genera XML vuoto/not found
     */
    generateNotFoundXml(): string;
    /**
     * Processa richiesta FreeSWITCH XML curl
     */
    processXmlRequest(params: FreeSwitchXmlParams): Promise<string>;
}
export declare const freeSwitchXmlService: FreeSwitchXmlService;
//# sourceMappingURL=freeswitch-xml.service.d.ts.map