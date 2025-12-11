import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPartnersTab } from './AdminPartnersTab';
import UserManagementTab from '../UserManagementTab';
import { UniversityCourseImporter } from '../UniversityCourseImporter';
import { AuditLogViewer } from '../AuditLogViewer';
import { Users, Building2, Upload, FileText } from 'lucide-react';

interface SettingsTabProps {
  isSuperAdmin: boolean;
  currentUserRole: 'admin' | 'super_admin';
  currentUserId: string;
}

export function SettingsTab({ isSuperAdmin, currentUserRole, currentUserId }: SettingsTabProps) {
  return (
    <Tabs defaultValue="partners" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="partners" className="gap-1.5">
          <Building2 className="h-4 w-4" />
          Partners
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-1.5">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        {isSuperAdmin && (
          <>
            <TabsTrigger value="import" className="gap-1.5">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Audit
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="partners">
        <AdminPartnersTab />
      </TabsContent>

      <TabsContent value="users">
        <UserManagementTab 
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      </TabsContent>

      {isSuperAdmin && (
        <>
          <TabsContent value="import">
            <UniversityCourseImporter />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
