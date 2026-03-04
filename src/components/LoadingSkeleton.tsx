import ClayCard from "./ClayCard";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <ClayCard>
        <div className="h-6 w-32 bg-muted rounded-lg mb-3" />
        <div className="h-12 w-48 bg-muted rounded-full mx-auto mb-3" />
        <div className="h-4 w-full bg-muted rounded-lg" />
      </ClayCard>
      <ClayCard>
        <div className="h-4 w-24 bg-muted rounded-lg mb-4" />
        <div className="h-44 bg-muted rounded-xl" />
      </ClayCard>
      <ClayCard>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded-lg" />
          ))}
        </div>
      </ClayCard>
    </div>
  );
}
