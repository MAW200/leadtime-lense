import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MOCK_USER_PROFILES } from '@/data/mockUsers';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { HOME_BY_ROLE } from '@/constants/routes';

export const LoginPage = () => {
  const { setUserProfile } = useRole();
  const navigate = useNavigate();

  const handleLogin = (profileId: string) => {
    const profile = MOCK_USER_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    setUserProfile({
      role: profile.role,
      userId: profile.id,
      userName: profile.name,
      userEmail: profile.email,
    });

    navigate(HOME_BY_ROLE[profile.role]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Select an Identity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a role to log in as. This is a password-less switcher for development and demos.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {MOCK_USER_PROFILES.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{profile.name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="outline" className="mt-2 capitalize">
                  {profile.role.replace('_', ' ')}
                </Badge>
              </div>
              <Button onClick={() => handleLogin(profile.id)}>Log In</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

