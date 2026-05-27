import es from "../messages/es.json";

export function useTranslations(namespace?: string) {
  return (key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = es as any;
    if (namespace) {
      return messages[namespace]?.[key] || key;
    }
    return messages[key] || key;
  };
}
