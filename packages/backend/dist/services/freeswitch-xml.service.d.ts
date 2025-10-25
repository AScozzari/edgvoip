export interface FreeSwitchXmlParams {
    section?: string;
    tag_name?: string;
    key_name?: string;
    key_value?: string;
    user?: string;
    domain?: string;
    action?: string;
    'Event-Name'?: string;
    'Caller-Caller-ID-Number'?: string;
    'Caller-Destination-Number'?: string;
    'Hunt-Destination-Number'?: string;
    'variable_domain_name'?: string;
    [key: string]: string | undefined;
}
export declare class FreeSwitchXmlService {
    /**
     * Genera XML per user registration/authentication
     */
    generateUserXml(extension: any, tenant: any): Promise<string>;
    /**
     * Genera XML per dialplan completo con routing italiano, trunk, IVR, code, voicemail
     */
    generateDialplanXml(tenant: any, params: FreeSwitchXmlParams): Promise<string>;
    /**
     * Genera XML vuoto/not found
     */
    generateNotFoundXml(): string;
    /**
     * Processa richiesta FreeSWITCH XML curl con fallback via extension
     */
    processXmlRequest(params: FreeSwitchXmlParams): Promise<string>;
}
export declare const freeSwitchXmlService: FreeSwitchXmlService;
//# sourceMappingURL=freeswitch-xml.service.d.ts.map