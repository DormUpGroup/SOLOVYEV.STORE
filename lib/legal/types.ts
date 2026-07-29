export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export interface LegalBundle {
  backToStore: string;
  privacy: LegalDocument;
  terms: LegalDocument;
}
