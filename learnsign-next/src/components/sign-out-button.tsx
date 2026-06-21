import { signOut } from "@/server/auth-actions";
import { Button } from "@/components/ui/button";

/** Server-action sign-out (works without client JS). */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
