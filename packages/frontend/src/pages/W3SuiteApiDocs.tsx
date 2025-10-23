import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Check, 
  Database, 
  Globe, 
  Key, 
  Shield, 
  BookOpen,
  Terminal,
  FileText
} from 'lucide-react';

export default function W3SuiteApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const baseUrl = 'http://localhost:3000/api/w3-voip';
  const authToken = 'Bearer YOUR_JWT_TOKEN_HERE';

  const apiEndpoints = [
    {
      title: 'VoIP Trunks',
      description: 'Gestione dei trunk SIP per la connessione ai provider',
      endpoints: [
        {
          method: 'GET',
          path: '/trunks',
          description: 'Lista tutti i trunk del tenant',
          example: `curl -X GET "${baseUrl}/trunks" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "sip_domain": "demo-tenant.edgvoip.local",
      "provider": "Messagenet",
      "proxy": "sip.messagenet.it",
      "port": 5060,
      "transport": "udp",
      "auth_username": "5406594427",
      "secret_ref": "secret-123",
      "register": true,
      "expiry_seconds": 3600,
      "codec_set": "G729,PCMA,PCMU",
      "status": "REG_OK",
      "note": "Test trunk"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/trunks',
          description: 'Crea un nuovo trunk SIP',
          example: `curl -X POST "${baseUrl}/trunks" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "Messagenet",
    "proxy": "sip.messagenet.it",
    "port": 5060,
    "transport": "udp",
    "auth_username": "5406594427",
    "secret_ref": "secret-123",
    "register": true,
    "expiry_seconds": 3600,
    "codec_set": "G729,PCMA,PCMU",
    "note": "Production trunk"
  }'`,
          response: `{
  "success": true,
  "data": {
    "id": "new-uuid",
    "tenant_id": "tenant-1",
    "sip_domain": "demo-tenant.edgvoip.local",
    "provider": "Messagenet",
    "proxy": "sip.messagenet.it",
    "port": 5060,
    "transport": "udp",
    "auth_username": "5406594427",
    "secret_ref": "secret-123",
    "register": true,
    "expiry_seconds": 3600,
    "codec_set": "G729,PCMA,PCMU",
    "status": "UNKNOWN",
    "note": "Production trunk"
  }
}`
        }
      ]
    },
    {
      title: 'VoIP Extensions',
      description: 'Gestione delle estensioni interne del tenant',
      endpoints: [
        {
          method: 'GET',
          path: '/extensions',
          description: 'Lista tutte le estensioni del tenant',
          example: `curl -X GET "${baseUrl}/extensions" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "sip_domain": "demo-tenant.edgvoip.local",
      "ext_number": "1001",
      "display_name": "John Doe",
      "enabled": true,
      "voicemail_enabled": true,
      "class_of_service": "agent",
      "note": "Sales team"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/extensions',
          description: 'Crea una nuova estensione',
          example: `curl -X POST "${baseUrl}/extensions" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ext_number": "1002",
    "display_name": "Jane Smith",
    "enabled": true,
    "voicemail_enabled": true,
    "class_of_service": "supervisor",
    "note": "Support team"
  }'`,
          response: `{
  "success": true,
  "data": {
    "id": "new-uuid",
    "tenant_id": "tenant-1",
    "sip_domain": "demo-tenant.edgvoip.local",
    "ext_number": "1002",
    "display_name": "Jane Smith",
    "enabled": true,
    "voicemail_enabled": true,
    "class_of_service": "supervisor",
    "note": "Support team"
  }
}`
        }
      ]
    },
    {
      title: 'VoIP DIDs',
      description: 'Gestione dei numeri DID (Direct Inward Dialing)',
      endpoints: [
        {
          method: 'GET',
          path: '/dids',
          description: 'Lista tutti i DID del tenant',
          example: `curl -X GET "${baseUrl}/dids" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "store_id": "store-1",
      "trunk_id": "trunk-uuid",
      "e164": "+390686356924",
      "sip_domain": "demo-tenant.edgvoip.local",
      "route_target_type": "ext",
      "route_target_ref": "1001",
      "label": "Main Line Roma",
      "active": true
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/dids',
          description: 'Crea un nuovo DID',
          example: `curl -X POST "${baseUrl}/dids" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "trunk_id": "trunk-uuid",
    "e164": "+39061234567",
    "route_target_type": "ivr",
    "route_target_ref": "ivr_main",
    "label": "Support Line",
    "active": true
  }'`,
          response: `{
  "success": true,
  "data": {
    "id": "new-uuid",
    "tenant_id": "tenant-1",
    "trunk_id": "trunk-uuid",
    "e164": "+39061234567",
    "sip_domain": "demo-tenant.edgvoip.local",
    "route_target_type": "ivr",
    "route_target_ref": "ivr_main",
    "label": "Support Line",
    "active": true
  }
}`
        }
      ]
    },
    {
      title: 'VoIP Routes',
      description: 'Gestione delle rotte di chiamata outbound',
      endpoints: [
        {
          method: 'GET',
          path: '/routes',
          description: 'Lista tutte le rotte del tenant',
          example: `curl -X GET "${baseUrl}/routes" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "name": "Uscita nazionale",
      "pattern": "^9(\\d+)$",
      "strip_digits": 1,
      "prepend": "0",
      "trunk_id": "trunk-uuid",
      "priority": 1,
      "active": true
    }
  ]
}`
        }
      ]
    },
    {
      title: 'Contact Policies',
      description: 'Gestione delle policy di contatto e orari',
      endpoints: [
        {
          method: 'GET',
          path: '/contact-policies',
          description: 'Lista tutte le policy del tenant',
          example: `curl -X GET "${baseUrl}/contact-policies" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "scope_type": "tenant",
      "scope_ref": "tenant-1",
      "rules_json": {
        "business_hours": {
          "monday": {"start": "09:00", "end": "18:00"},
          "tuesday": {"start": "09:00", "end": "18:00"}
        },
        "fallback": "voicemail"
      },
      "active": true,
      "label": "Orari Roma"
    }
  ]
}`
        }
      ]
    },
    {
      title: 'CDR & Activity Logs',
      description: 'Accesso ai Call Detail Records e log delle attività',
      endpoints: [
        {
          method: 'GET',
          path: '/cdr-activity/cdr',
          description: 'Recupera i CDR con filtri',
          example: `curl -X GET "${baseUrl}/cdr-activity/cdr?start_date=2024-01-01&end_date=2024-01-31&direction=in" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenant_id": "tenant-1",
      "sip_domain": "demo-tenant.edgvoip.local",
      "call_id": "call-001",
      "direction": "in",
      "from_uri": "+390686356924",
      "to_uri": "1001",
      "did_e164": "+390686356924",
      "ext_number": "1001",
      "start_ts": "2024-01-15T10:30:00Z",
      "answer_ts": "2024-01-15T10:30:05Z",
      "end_ts": "2024-01-15T10:40:00Z",
      "billsec": 600,
      "disposition": "ANSWERED",
      "recording_url": "https://recordings.example.com/call-001.wav",
      "meta_json": {"codec": "G729", "mos": 4.2}
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "has_more": false
  }
}`
        },
        {
          method: 'GET',
          path: '/cdr-activity/cdr/stats',
          description: 'Statistiche dei CDR',
          example: `curl -X GET "${baseUrl}/cdr-activity/cdr/stats?start_date=2024-01-01&end_date=2024-01-31" \\
  -H "Authorization: ${authToken}" \\
  -H "Content-Type: application/json"`,
          response: `{
  "success": true,
  "data": {
    "total_calls": 150,
    "answered_calls": 120,
    "missed_calls": 30,
    "total_duration": 7200,
    "avg_duration": 60,
    "by_direction": {"inbound": 100, "outbound": 50},
    "by_disposition": {"ANSWERED": 120, "NO_ANSWER": 20, "BUSY": 10}
  }
}`
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">W3 Suite API Documentation</h1>
          <p className="text-muted-foreground">
            Documentazione completa per l'integrazione con EDG VoIP System
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Globe className="h-4 w-4 mr-2" />
          External API
        </Badge>
      </div>

      {/* Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Autenticazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">JWT Token</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Tutte le API richiedono un token JWT valido nell'header Authorization.
            </p>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              Authorization: Bearer YOUR_JWT_TOKEN_HERE
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Base URL</h4>
            <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
              {baseUrl}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Tenant Isolation</h4>
            <p className="text-sm text-muted-foreground">
              Il tenant_id viene estratto automaticamente dal JWT token. 
              Tutti i dati sono isolati per tenant.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Tabs defaultValue="trunks" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="trunks">Trunks</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="dids">DIDs</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="cdr">CDR</TabsTrigger>
        </TabsList>

        {apiEndpoints.map((section, sectionIndex) => (
          <TabsContent key={section.title} value={section.title.toLowerCase().split(' ')[0]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
                          className="font-mono"
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.example, `${sectionIndex}-${endpointIndex}-example`)}
                      >
                        {copiedCode === `${sectionIndex}-${endpointIndex}-example` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      {endpoint.description}
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2 flex items-center">
                          <Terminal className="h-4 w-4 mr-2" />
                          Esempio cURL
                        </h5>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                          <pre>{endpoint.example}</pre>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Risposta
                        </h5>
                        <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                          <pre className="text-gray-800">{endpoint.response}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Guida all'Integrazione
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Autenticazione</h4>
            <p className="text-sm text-muted-foreground">
              Ottieni un JWT token dal sistema di autenticazione W3 Suite e includilo in ogni richiesta.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Tenant Context</h4>
            <p className="text-sm text-muted-foreground">
              Il tenant_id viene estratto automaticamente dal JWT. Non è necessario specificarlo nelle richieste.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Error Handling</h4>
            <p className="text-sm text-muted-foreground">
              Tutte le API restituiscono un formato standardizzato con success/error e messaggi descrittivi.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">4. Rate Limiting</h4>
            <p className="text-sm text-muted-foreground">
              Le API hanno rate limiting configurato. Gestisci i codici di risposta 429 appropriatamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Supporto e Sicurezza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Sicurezza</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Tutte le comunicazioni sono criptate (HTTPS)</li>
              <li>• JWT tokens hanno scadenza configurata</li>
              <li>• Tenant isolation garantita a livello database</li>
              <li>• Rate limiting per prevenire abusi</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Supporto</h4>
            <p className="text-sm text-muted-foreground">
              Per supporto tecnico o domande sull'integrazione, contatta il team EDG VoIP.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
