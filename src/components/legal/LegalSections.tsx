export type LegalSection = {
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly list?: readonly string[];
};

export function LegalSections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <div className="info-sections">
      {sections.map((section) => (
        <section key={section.title} className="info-section">
          <h2 className="info-section-title">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="info-section-p">
              {paragraph}
            </p>
          ))}
          {section.list?.length ? (
            <ul className="info-section-list">
              {section.list.map((item) => (
                <li key={item.slice(0, 24)}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
