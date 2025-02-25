"use client";

import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InstanceState, WhatsappInstance } from "./interface";

// Tipo do formulário para criação de instância
type Inputs = {
  instanceName: string;
};

// Endereço base do servidor (pode ser configurado via variável de ambiente)
const baseUrl =
  process.env.NEXT_PUBLIC_EVO_API_URL || "https://evo1.whatsdev.com.br";

export default function Whatsapp() {
  const { data: session } = useSession();
  const [dataInstance, setDataInstance] = useState<WhatsappInstance | null>(
    null
  );
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  // Indica se uma instância já foi criada (mesmo que esteja deslogada)
  const [wasInstanceCreated, setWasInstanceCreated] = useState(false);

  const { register, handleSubmit } = useForm<Inputs>();

  /** Função para buscar o estado da instância */
  const fetchInstanceState = async (instanceName: string) => {
    const response = await fetch(
      `${baseUrl}/instance/connectionState/${instanceName}`,
      {
        headers: new Headers({
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
        }),
      }
    );
    return response.json();
  };

  // Query para verificar o estado da instância atual (executa somente se houver instância)
  const { data: instanceState } = useQuery<InstanceState>({
    queryKey: ["instance-state", dataInstance?.instance?.instanceName],
    queryFn: () =>
      fetchInstanceState(dataInstance?.instance?.instanceName || ""),
    enabled: !!dataInstance,
    refetchInterval: 5000, // Atualiza o status a cada 5s
  });

  /** Mutation para criar nova instância */
  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: Inputs) => {
      const instanceName = `${session?.user?.id}-${formData.instanceName}`;
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
        }),
        body: JSON.stringify({
          instanceName,
          token: process.env.NEXT_PUBLIC_EVO_API_KEY,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      const responseData = await response.json();
      // Seta a instância atual e salva no localStorage
      setDataInstance(responseData);
      localStorage.setItem("devshub:instance-name", instanceName);
      setQrcode(responseData.qrcode?.base64);
      setWasInstanceCreated(true);
      toast.success("Instância criada com sucesso!");
      return responseData;
    },
    onError: (err: unknown) => {
      toast.error("Erro ao criar instância", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      });
    },
  });

  /** Mutation para deslogar a instância */
  const { mutate: logoutInstance, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      if (!dataInstance) throw new Error("Nenhuma instância para deslogar");
      const response = await fetch(
        `${baseUrl}/instance/logout/${dataInstance.instance.instanceName}`,
        {
          method: "POST",
          headers: new Headers({
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
          }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast.success("Instância deslogada com sucesso");
      // Remove a instância e mantém wasInstanceCreated como true para mostrar a listagem
      setDataInstance(null);
      localStorage.removeItem("devshub:instance-name");
      setWasInstanceCreated(true);
    },
    onError: () => {
      toast.error("Erro ao deslogar a instância");
    },
  });

  /** Mutation para deletar a instância */
  const { mutate: deleteInstance, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!dataInstance) throw new Error("Nenhuma instância para deletar");
      const response = await fetch(
        `${baseUrl}/instance/delete/${dataInstance.instance.instanceName}`,
        {
          method: "DELETE",
          headers: new Headers({
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
          }),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      toast.success("Instância deletada com sucesso");
      setDataInstance(null);
      localStorage.removeItem("devshub:instance-name");
      setQrcode(null);
      // Permite a criação de uma nova instância
      setWasInstanceCreated(false);
    },
    onError: () => {
      toast.error("Erro ao deletar a instância");
    },
  });

  /** Query para listar instâncias disponíveis para conexão.
   * Essa query é ativada quando não há instância ativa e uma instância foi criada anteriormente.
   */
  const { data: instances } = useQuery<any[]>({
    queryKey: ["fetch-instances"],
    queryFn: async () => {
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: new Headers({
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
        }),
      });
      return response.json();
    },
    enabled: !dataInstance && wasInstanceCreated,
  });

  /** Função para conectar em uma instância a partir da listagem */
  const handleConnectInstance = async (instanceName: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/instance/connect/${instanceName}`,
        {
          headers: new Headers({
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_EVO_API_KEY || "",
          }),
        }
      );
      const data = await response.json();
      setQrcode(data.qrcode?.base64 || null);
      // Após conectar, registramos a instância ativa
      setDataInstance({ instance: { instanceName } } as WhatsappInstance);
      toast.success(`Conectando à instância ${instanceName}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      toast.error("Erro ao conectar a instância");
    }
  };

  /** Efeito para carregar a instância do localStorage e validar o status */
  useEffect(() => {
    const storedInstanceName = localStorage.getItem("devshub:instance-name");
    if (storedInstanceName) {
      fetchInstanceState(storedInstanceName)
        .then((data) => {
          if (data?.instance?.state !== "closed") {
            setDataInstance({
              instance: { instanceName: storedInstanceName },
            } as WhatsappInstance);
            setWasInstanceCreated(true);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  /** Efeito para atualizar o contador enquanto a instância estiver conectando */
  useEffect(() => {
    if (instanceState?.instance?.state === "connecting") {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev === 0 ? 60 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [instanceState]);

  /** Função de envio do formulário para criar nova instância */
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    // Permite a criação somente se nenhuma instância foi criada anteriormente
    if (!wasInstanceCreated) {
      mutate(data);
    }
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  console.log(instances);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Whatsapp</h1>

      {/* Exibe o QR Code, se disponível */}
      {qrcode && instanceState?.instance?.state === "connecting" && (
        <div className="mb-4">
          <img src={qrcode} alt="QR Code" />
        </div>
      )}

      {/* Se houver instância ativa, mostra o status e os botões de logout e delete */}
      {dataInstance && (
        <div className="my-6 border rounded p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">Status Whatsapp</h2>
            <div
              className={cn(
                "w-4 h-4 rounded-full",
                instanceState?.instance?.state === "connecting" &&
                  "bg-yellow-500",
                instanceState?.instance?.state === "open" && "bg-green-500",
                instanceState?.instance?.state === "closed" && "bg-red-500"
              )}
            />
            {instanceState?.instance?.state === "connecting" && (
              <p className="text-sm text-gray-500">
                Atualizando em: {countdown}s
              </p>
            )}
          </div>

          <div className="flex gap-2 w-1/2">
            {instanceState?.instance?.state === "open" && (
              <Button onClick={() => logoutInstance()} disabled={isLoggingOut}>
                {isLoggingOut ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Deslogar Instância"
                )}
              </Button>
            )}
            <Button onClick={() => deleteInstance()} disabled={isDeleting}>
              {isDeleting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Deletar Instância"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Se não houver instância ativa */}
      {!dataInstance && (
        <>
          {wasInstanceCreated ? (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">
                Instâncias Disponíveis para Conexão
              </h2>
              {instances && instances.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {instances.map((inst: any) => (
                    <li
                      key={inst.name}
                      className="flex items-center justify-between border p-2 rounded"
                    >
                      <span>{inst.name}</span>
                      <Button onClick={() => handleConnectInstance(inst.name)}>
                        Conectar
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma instância disponível.</p>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2 w-full max-w-md"
            >
              <div className="flex flex-col gap-2">
                <Label>Nome da instância</Label>
                <Input type="text" {...register("instanceName")} />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Criar
              </Button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
