import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutForm({
  className,
}: {
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm" className={className}>
        ログアウト
      </Button>
    </form>
  );
}
