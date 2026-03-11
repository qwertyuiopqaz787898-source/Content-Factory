export interface Draft {
  id: number;
  topic: string;
  ideas: string;
  selectedIdea: string;
  script: string;
  thumbnailPrompt: string;
  thumbnailUrl: string;
  assets: string;
  metadata: string;
  step: number;
  updated_at: string;
}

export async function fetchDrafts(): Promise<Draft[]> {
  const res = await fetch('/api/drafts');
  return res.json();
}

export async function saveDraft(draft: Partial<Draft>): Promise<any> {
  const method = draft.id ? 'PUT' : 'POST';
  const url = draft.id ? `/api/drafts/${draft.id}` : '/api/drafts';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  return res.json();
}

export async function deleteDraft(id: number): Promise<void> {
  await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
}
