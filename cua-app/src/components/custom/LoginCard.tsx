import GitHubSignInButton from "../GitHubSignInButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

function LoginCard({
  loginWithGithubText = "Login with GitHub",
  loginCardTitle = "Login to your account",
  loginCardDescription = "Sign up or Login via your GitHub account!",
}: {
  loginWithGithubText?: string;
  loginCardTitle?: string;
  loginCardDescription?: string;
}) {
  return (
    <Card className="w-full max-w-sm border">
      <CardHeader>
        <CardTitle>{loginCardTitle}</CardTitle>
        <CardDescription>{loginCardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <GitHubSignInButton buttonText={loginWithGithubText} />
      </CardContent>
    </Card>
  );
}

export default LoginCard;
