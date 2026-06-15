import { EntryList } from '@/components/entries/EntryList';

export default function EntriesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-display text-foreground mb-3">Your Entries</h1>
        <p className="text-muted-foreground">
          A chronological record of your thoughts, reflections, and experiences.
        </p>
      </div>
      
      <EntryList />
    </div>
  );
}
