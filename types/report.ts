export type StudentRow = {
  id: string;
  selected: boolean;
  number: number;
  name: string;
  reference: string;
  evaluation: string;
  comment: string;
};

export type Notice = {
  type: "success" | "error" | "info";
  message: string;
} | null;
