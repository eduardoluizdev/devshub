export interface WhatsappInstance {
  instance: Instance;
  hash: Hash;
  webhook: Webhook;
  websocket: Websocket;
  rabbitmq: Rabbitmq;
  sqs: Sqs;
  typebot: Typebot;
  settings: Settings;
  qrcode: Qrcode;
}

export interface Instance {
  instanceName: string;
  instanceId: string;
  integration: string;
  webhook_wa_business: unknown;
  access_token_wa_business: string;
  status: string;
}

export interface Hash {
  apikey: string;
}

export interface Webhook {
  url: string;
  enabled: boolean;
}

export interface Websocket {
  url: string;
  enabled: boolean;
}

export interface Rabbitmq {
  url: string;
  queue: string;
  enabled: boolean;
}

export interface Sqs {
  url: string;
  queue: string;
  enabled: boolean;
}

export interface Typebot {
  enabled: boolean;
}

export interface Settings {
  reject_call: boolean;
  msg_call: string;
  groups_ignore: boolean;
  always_online: boolean;
  read_messages: boolean;
  read_status: boolean;
  sync_full_history: boolean;
}

export interface Qrcode {
  pairingCode: unknown;
  code: string;
  base64: string;
  count: number;
}

export interface InstanceState {
  instance: InstanceStateProps;
}

export interface InstanceStateProps {
  instanceName: string;
  state: string;
}
