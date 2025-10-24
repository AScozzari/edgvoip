import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, User, Building2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

interface AdminUser {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'tenant_admin' | 'super_admin';
}

interface Company {
  legal_name: string;
  vat_number: string;
  tax_code: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
}

interface Contact {
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
}

export default function CreateTenant() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [tenantData, setTenantData] = useState({
    name: '',
    slug: '',
    domain: '',
    sip_domain: ''
  });

  const [adminUser, setAdminUser] = useState<AdminUser>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'tenant_admin'
  });

  const [companies, setCompanies] = useState<Company[]>([
    {
      legal_name: '',
      vat_number: '',
      tax_code: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Italy',
      is_primary: true
    }
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    {
      first_name: '',
      last_name: '',
      role: '',
      email: '',
      phone: '',
      mobile: '',
      is_primary: true
    }
  ]);

  const steps = [
    { id: 1, title: 'Informazioni Tenant', icon: Building2 },
    { id: 2, title: 'Utente Admin', icon: User },
    { id: 3, title: 'Ragioni Sociali', icon: Building2 },
    { id: 4, title: 'Contatti', icon: Users }
  ];

  const handleTenantDataChange = (field: string, value: string) => {
    setTenantData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setTenantData(prev => ({ ...prev, slug }));
    }
  };

  const handleAdminUserChange = (field: keyof AdminUser, value: string) => {
    setAdminUser(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (index: number, field: keyof Company, value: string | boolean) => {
    setCompanies(prev => prev.map((company, i) => 
      i === index ? { ...company, [field]: value } : company
    ));
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string | boolean) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
  };

  const addCompany = () => {
    setCompanies(prev => [...prev, {
      legal_name: '',
      vat_number: '',
      tax_code: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Italy',
      is_primary: false
    }]);
  };

  const removeCompany = (index: number) => {
    if (companies.length > 1) {
      setCompanies(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addContact = () => {
    setContacts(prev => [...prev, {
      first_name: '',
      last_name: '',
      role: '',
      email: '',
      phone: '',
      mobile: '',
      is_primary: false
    }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(tenantData.name && tenantData.slug && tenantData.domain && tenantData.sip_domain);
      case 2:
        return !!(adminUser.first_name && adminUser.last_name && adminUser.email && adminUser.password);
      case 3:
        return companies.every(c => c.legal_name) && companies.some(c => c.is_primary);
      case 4:
        return contacts.every(c => c.first_name && c.last_name) && contacts.some(c => c.is_primary);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori prima di procedere",
        variant: "destructive",
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.createTenantWithCompanies({
        ...tenantData,
        admin_user: adminUser,
        companies,
        contacts
      });

      toast({
        title: "Successo",
        description: "Tenant creato con successo",
      });

      navigate('/edgvoip/tenants');
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del tenant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Tenant *</Label>
                <Input
                  id="name"
                  value={tenantData.name}
                  onChange={(e) => handleTenantDataChange('name', e.target.value)}
                  placeholder="Es. Azienda Demo"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={tenantData.slug}
                  onChange={(e) => handleTenantDataChange('slug', e.target.value)}
                  placeholder="Es. azienda-demo"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="domain">Dominio *</Label>
                <Input
                  id="domain"
                  value={tenantData.domain}
                  onChange={(e) => handleTenantDataChange('domain', e.target.value)}
                  placeholder="Es. azienda-demo.local"
                />
              </div>
              <div>
                <Label htmlFor="sip_domain">SIP Domain *</Label>
                <Input
                  id="sip_domain"
                  value={tenantData.sip_domain}
                  onChange={(e) => handleTenantDataChange('sip_domain', e.target.value)}
                  placeholder="Es. sip.azienda-demo.local"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={adminUser.first_name}
                  onChange={(e) => handleAdminUserChange('first_name', e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Cognome *</Label>
                <Input
                  id="last_name"
                  value={adminUser.last_name}
                  onChange={(e) => handleAdminUserChange('last_name', e.target.value)}
                  placeholder="Cognome"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={adminUser.email}
                onChange={(e) => handleAdminUserChange('email', e.target.value)}
                placeholder="admin@azienda-demo.local"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={adminUser.password}
                onChange={(e) => handleAdminUserChange('password', e.target.value)}
                placeholder="Password sicura"
              />
            </div>
            <div>
              <Label htmlFor="role">Ruolo</Label>
              <Select value={adminUser.role} onValueChange={(value: 'tenant_admin' | 'super_admin') => handleAdminUserChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Ragioni Sociali</h3>
              <Button onClick={addCompany} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi
              </Button>
            </div>
            {companies.map((company, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Azienda {index + 1}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={company.is_primary}
                          onCheckedChange={(checked) => handleCompanyChange(index, 'is_primary', checked)}
                        />
                        <Label className="text-sm">Primaria</Label>
                      </div>
                      {companies.length > 1 && (
                        <Button
                          onClick={() => removeCompany(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Ragione Sociale *</Label>
                    <Input
                      value={company.legal_name}
                      onChange={(e) => handleCompanyChange(index, 'legal_name', e.target.value)}
                      placeholder="Ragione sociale"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Partita IVA</Label>
                      <Input
                        value={company.vat_number}
                        onChange={(e) => handleCompanyChange(index, 'vat_number', e.target.value)}
                        placeholder="IT12345678901"
                      />
                    </div>
                    <div>
                      <Label>Codice Fiscale</Label>
                      <Input
                        value={company.tax_code}
                        onChange={(e) => handleCompanyChange(index, 'tax_code', e.target.value)}
                        placeholder="RSSMRA80A01H501U"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Indirizzo</Label>
                    <Textarea
                      value={company.address}
                      onChange={(e) => handleCompanyChange(index, 'address', e.target.value)}
                      placeholder="Via, numero civico"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Città</Label>
                      <Input
                        value={company.city}
                        onChange={(e) => handleCompanyChange(index, 'city', e.target.value)}
                        placeholder="Milano"
                      />
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <Input
                        value={company.state}
                        onChange={(e) => handleCompanyChange(index, 'state', e.target.value)}
                        placeholder="MI"
                      />
                    </div>
                    <div>
                      <Label>CAP</Label>
                      <Input
                        value={company.postal_code}
                        onChange={(e) => handleCompanyChange(index, 'postal_code', e.target.value)}
                        placeholder="20100"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Paese</Label>
                    <Input
                      value={company.country}
                      onChange={(e) => handleCompanyChange(index, 'country', e.target.value)}
                      placeholder="Italy"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Contatti</h3>
              <Button onClick={addContact} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi
              </Button>
            </div>
            {contacts.map((contact, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Contatto {index + 1}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={contact.is_primary}
                          onCheckedChange={(checked) => handleContactChange(index, 'is_primary', checked)}
                        />
                        <Label className="text-sm">Primario</Label>
                      </div>
                      {contacts.length > 1 && (
                        <Button
                          onClick={() => removeContact(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={contact.first_name}
                        onChange={(e) => handleContactChange(index, 'first_name', e.target.value)}
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label>Cognome *</Label>
                      <Input
                        value={contact.last_name}
                        onChange={(e) => handleContactChange(index, 'last_name', e.target.value)}
                        placeholder="Cognome"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Ruolo</Label>
                    <Input
                      value={contact.role}
                      onChange={(e) => handleContactChange(index, 'role', e.target.value)}
                      placeholder="Es. Amministratore, Responsabile IT"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                      placeholder="contatto@azienda-demo.local"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Telefono</Label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        placeholder="02 1234567"
                      />
                    </div>
                    <div>
                      <Label>Cellulare</Label>
                      <Input
                        value={contact.mobile}
                        onChange={(e) => handleContactChange(index, 'mobile', e.target.value)}
                        placeholder="+39 123 456 7890"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crea Nuovo Tenant</h1>
          <p className="text-muted-foreground">
            Configura un nuovo tenant con utenza admin, ragioni sociali e contatti
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/edgvoip/tenants')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna ai Tenant
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive ? 'border-blue-600 bg-blue-600 text-white' :
                isCompleted ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300 bg-white text-gray-500'
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5 mr-2" })}
            {steps[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Configura le informazioni base del tenant"}
            {currentStep === 2 && "Crea l'utenza amministratore per il tenant"}
            {currentStep === 3 && "Aggiungi le ragioni sociali associate al tenant"}
            {currentStep === 4 && "Definisci i contatti di riferimento"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Precedente
        </Button>
        
        <div className="flex space-x-2">
          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Creazione...' : 'Crea Tenant'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
