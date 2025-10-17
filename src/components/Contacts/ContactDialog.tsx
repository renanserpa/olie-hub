import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: any;
  onSuccess?: () => void;
}

export function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [birthdate, setBirthdate] = useState<Date | undefined>(
    contact?.birthdate ? new Date(contact.birthdate) : undefined,
  );
  const [formData, setFormData] = useState({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    whatsapp: contact?.whatsapp || "",
    instagram: contact?.instagram || "",
    cpf_cnpj: contact?.cpf_cnpj || "",
    notes: contact?.notes || "",
    address: contact?.address || {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
    },
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || "",
        email: contact.email || "",
        phone: contact.phone || "",
        whatsapp: contact.whatsapp || "",
        instagram: contact.instagram || "",
        cpf_cnpj: contact.cpf_cnpj || "",
        notes: contact.notes || "",
        address: contact.address || {
          cep: "",
          logradouro: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          pais: "Brasil",
        },
      });
      setBirthdate(contact.birthdate ? new Date(contact.birthdate) : undefined);
    }
  }, [contact]);

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      toast({ title: "CEP deve ter 8 dígitos", variant: "destructive" });
      return;
    }

    setLoadingCep(true);

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }

      setFormData({
        ...formData,
        address: {
          ...formData.address,
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        },
      });

      toast({ title: "Endereço encontrado!" });
      setTimeout(() => document.getElementById("numero")?.focus(), 100);
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 3) {
      toast({
        title: "Nome deve ter pelo menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const contactData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        instagram: formData.instagram?.replace("@", "") || null,
        cpf_cnpj: formData.cpf_cnpj || null,
        notes: formData.notes || null,
        birthdate: birthdate ? format(birthdate, "yyyy-MM-dd") : null,
        address: formData.address.cep ? formData.address : null,
        created_by: user?.id,
      };

      if (contact?.id) {
        const { error } = await supabase
          .from("contacts")
          .update(contactData)
          .eq("id", contact.id);

        if (error) throw error;
        toast({ title: "Contato atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("contacts").insert([contactData]);

        if (error) throw error;
        toast({ title: "Contato criado com sucesso!" });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving contact:", error);
      toast({
        title: "Erro ao salvar contato",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Editar Contato" : "Novo Contato"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="font-semibold">Dados Pessoais</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="birthdate">Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !birthdate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {birthdate
                        ? format(birthdate, "dd/MM/yyyy")
                        : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={birthdate}
                      onSelect={setBirthdate}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf_cnpj: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contato</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                />
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1"
                  onClick={() =>
                    setFormData({ ...formData, whatsapp: formData.phone })
                  }
                >
                  Mesmo do telefone
                </Button>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  placeholder="@usuario"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </h3>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.address.cep}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, cep: e.target.value },
                      })
                    }
                    onBlur={(e) => handleCepBlur(e.target.value)}
                    placeholder="12345-678"
                    maxLength={9}
                  />
                  {loadingCep && (
                    <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3" />
                  )}
                </div>
              </div>

              <div className="col-span-4">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={formData.address.logradouro}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.address.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, numero: e.target.value },
                    })
                  }
                  required={!!formData.address.cep}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.address.complemento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        complemento: e.target.value,
                      },
                    })
                  }
                  placeholder="Apto, Bloco, etc"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.address.bairro}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.address.cidade}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.address.estado}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Notas internas sobre o contato..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contact ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
