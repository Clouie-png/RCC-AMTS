import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import image from "@/assets/image.png";

export function LoginForm({
  className,
  onSubmit,
  name,
  setName,
  password,
  setPassword,
  ...props
}) {
  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={onSubmit} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <img src={image} />
        <h3 className="scroll-m-20 font-size-30px font-semibold tracking-tight text-blue-500">
          ASSET MAINTENANCE TICKETING SYSTEM
        </h3>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full">
          Login
        </Button>
      </div>
    </form>
  );
}
