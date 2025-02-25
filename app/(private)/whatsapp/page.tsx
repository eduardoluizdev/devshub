"use client";

import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InstanceState, WhatsappInstance } from "./interface";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Inputs = {
  instanceName: string;
};

export default function Whatsapp() {
  const { data: session } = useSession();
  const [dataInstance, setDataInstance] = useState<WhatsappInstance | null>(
    null
  );
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit } = useForm<Inputs>();

  // Função para buscar estado da instância
  const fetchInstanceState = async (instanceName: string) => {
    const response = await fetch(
      `https://evo1.whatsdev.com.br/instance/connectionState/${instanceName}`,
      {
        headers: {
          "Content-Type": "application/json",
          apikey: `${process.env.NEXT_PUBLIC_EVO_API_KEY}`,
        },
      }
    );
    return response.json();
  };

  // Query para verificar o estado da instância
  const { data: instanceState, refetch: refetchState } =
    useQuery<InstanceState>({
      queryKey: ["instance-state", dataInstance?.instance?.instanceName],
      queryFn: () =>
        fetchInstanceState(dataInstance?.instance?.instanceName || ""),
      enabled: !!dataInstance,
      refetchInterval: 5000,
    });

  // Mutation para criar uma nova instância
  const { mutate, isPending } = useMutation({
    mutationFn: async (formData: Inputs) => {
      try {
        const instanceName = `${session?.user?.id}-${formData.instanceName}`;
        const response = await fetch(
          `https://evo1.whatsdev.com.br/instance/create`,
          {
            headers: {
              "Content-Type": "application/json",
              apikey: `${process.env.NEXT_PUBLIC_EVO_API_KEY}`,
            },
            method: "POST",
            body: JSON.stringify({
              instanceName,
              token: process.env.NEXT_PUBLIC_EVO_API_KEY,
              qrcode: true,
              integration: "WHATSAPP-BAILEYS",
            }),
          }
        );

        const responseData = await response.json();
        setDataInstance(responseData);
        localStorage.setItem("devshub:instance-name", instanceName);

        setQrcode(responseData.qrcode.base64);
        toast.success("Instância criada com sucesso!");

        return responseData;
      } catch (err) {
        toast.error("Erro ao criar instância", {
          description: err instanceof Error ? err.message : "Erro desconhecido",
        });
        throw err;
      }
    },
  });

  // Efeito para carregar instância do localStorage e validar status
  useEffect(() => {
    const storedInstanceName = localStorage.getItem("devshub:instance-name");

    if (storedInstanceName) {
      fetchInstanceState(storedInstanceName)
        .then((data) => {
          if (data?.instance?.state !== "closed") {
            setDataInstance({
              instance: { instanceName: storedInstanceName },
            } as WhatsappInstance);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Efeito para atualizar o contador de tempo
  useEffect(() => {
    if (instanceState?.instance?.state === "connecting") {
      const interval = setInterval(() => {
        setCountdown((prev) => (prev === 0 ? 60 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [instanceState]);

  // Enviar formulário
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (!dataInstance) {
      mutate(data);
    }
  };

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Whatsapp</h1>

      <div className="my-6 border rounded p-6 flex items-center gap-2">
        <h2 className="text-lg font-bold">Status Whatsapp</h2>
        <div
          className={cn(
            "size-4 rounded-full",
            instanceState?.instance?.state === "connecting" && "bg-yellow-500",
            instanceState?.instance?.state === "open" && "bg-green-500",
            instanceState?.instance?.state === "closed" && "bg-red-500"
          )}
        />

        {instanceState?.instance?.state === "connecting" && (
          <>
            <p className="text-sm text-gray-500 mt-2">
              Próxima atualização em: {countdown}s
            </p>
            <Button onClick={() => refetchState()}>Atualizar Status</Button>
          </>
        )}
      </div>

      {!dataInstance && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2 w-full max-w-md"
        >
          <div className="flex gap-2 flex-col">
            <Label>Nome da instância</Label>
            <Input type="text" {...register("instanceName")} />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Criar
          </Button>
        </form>
      )}

      {dataInstance && instanceState?.instance?.state !== "open" && qrcode && (
        <div className="mt-6">
          <img src={qrcode} alt="QR Code" />
        </div>
      )}
    </div>
  );
}
