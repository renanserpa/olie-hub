import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ContactDialog } from '@/components/Contacts/ContactDialog';
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Instagram, 
  MapPin,
  Edit,
  MessageCircle,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { format, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  birthdate: string | null;
  address: any;
  created_at: string;
  notes: string | null;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast({ 
        title: 'Erro ao carregar contatos', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone?.includes(searchTerm);

    if (activeTab === 'birthdays') {
      return matchesSearch && contact.birthdate && isThisMonth(new Date(contact.birthdate));
    }

    return matchesSearch;
  });

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDialogOpen(true);
  };

  const handleNewContact = () => {
    setSelectedContact(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedContact(undefined);
  };

  const handleSuccess = () => {
    fetchContacts();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e fornecedores
          </p>
        </div>
        <Button onClick={handleNewContact}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos ({contacts.length})</TabsTrigger>
            <TabsTrigger value="birthdays">
              <Calendar className="w-4 h-4 mr-2" />
              Aniversariantes do Mês
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum contato encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Tente ajustar sua busca'
                      : 'Comece adicionando seu primeiro contato'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleNewContact}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Adicionar Contato
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredContacts.map(contact => (
                  <Card key={contact.id} className="p-6 hover:shadow-glow transition-smooth">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {getInitials(contact.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Link 
                              to={`/contacts/${contact.id}`}
                              className="text-lg font-semibold hover:text-primary transition-smooth"
                            >
                              {contact.name}
                            </Link>
                            {contact.birthdate && isThisMonth(new Date(contact.birthdate)) && (
                              <Badge variant="secondary" className="ml-2">
                                <Calendar className="w-3 h-3 mr-1" />
                                Aniversariante
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.whatsapp && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MessageCircle className="w-4 h-4" />
                              <a 
                                href={`https://wa.me/55${contact.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-smooth"
                              >
                                {contact.whatsapp}
                              </a>
                            </div>
                          )}
                          {contact.instagram && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Instagram className="w-4 h-4" />
                              <a 
                                href={`https://instagram.com/${contact.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-smooth"
                              >
                                @{contact.instagram}
                              </a>
                            </div>
                          )}
                          {contact.address?.cidade && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                              <MapPin className="w-4 h-4" />
                              <span>{contact.address.cidade}, {contact.address.estado}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ContactDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        contact={selectedContact}
        onSuccess={handleSuccess}
      />
    </div>
  );
}