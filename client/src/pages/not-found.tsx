import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Card className="card-mafia max-w-md p-8 text-center">
        <div className="space-y-6">
          <h1 className="text-3xl font-heading text-gold-gradient">404</h1>
          <h2 className="text-2xl font-heading">Territory Not Found</h2>
          <p className="text-muted-foreground">
            This part of town doesn't exist, boss. Looks like you've wandered into
            the wrong neighborhood.
          </p>
          <Link href="/">
            <Button className="mt-6">Return to Home Territory</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}