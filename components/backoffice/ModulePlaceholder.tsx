type ModulePlaceholderProps = {
  moduleName: string;
  summary: string;
  backlog: string[];
};

export function ModulePlaceholder({ moduleName, summary, backlog }: ModulePlaceholderProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
      <h2 className="font-condensed text-3xl font-black uppercase tracking-tight text-starfeet-blue">{moduleName}</h2>
      <p className="mt-2 text-sm text-gray-600">{summary}</p>
      <ul className="mt-4 space-y-2">
        {backlog.map((item) => (
          <li key={item} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
