'use client';

interface ContentGridProps {
  searchQuery: string;
}

export default function ContentGrid({ searchQuery }: ContentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="text-center py-12 text-muted-foreground">
        Grid view coming soon...
      </div>
    </div>
  );
}