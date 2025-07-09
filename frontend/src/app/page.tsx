export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Burstlet
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-Powered Content Creation & Distribution Platform
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 border border-input rounded-md hover:bg-accent transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}