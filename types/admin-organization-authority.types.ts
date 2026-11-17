export type AuthorityPerson = { user_id: string; full_name: string; username: string; email: string | null; avatar_url?: string | null; account_type?: string | null; status?: string | null; verified: boolean };
export type AuthorityMembership = { membership_id: string; organization_user_id: string; person: AuthorityPerson; primary_role: string; employment_type: string; status: string; permissions: string[]; starts_at: string; ends_at?: string | null; reports_to_user_id?: string | null; source_type: string; public_profile_visible: boolean; version: number; updated_at: string };
export type OrganizationAuthority = {
  generated_at: string;
  summary: { organizations: number; clubs: number; academies: number; active_staff: number; pending_invitations: number; high_authority_holders: number; organizations_with_risks: number };
  items: Array<{
    organization: { user_id: string; name: string; username: string; email: string; avatar_url?: string | null; cover_url?: string | null; type: "club" | "academy"; country?: string | null; city?: string | null; status: string; verified: boolean; pending_verification: boolean; profile_visibility?: string | null; created_at: string };
    authority: { active_staff: number; suspended_staff: number; ended_staff: number; pending_invitations: number; high_authority_holders: number; active_team_assignments: number; active_programme_assignments: number };
    risks: string[];
    staff: AuthorityMembership[];
    invitations: Array<{ invitation_id: string; person: AuthorityPerson | null; role: string; employment_type: string; status: string; expires_at: string; created_at: string }>;
  }>;
  recent_history: Array<{ history_id: string; organization_user_id?: string | null; person_user_id?: string | null; actor_user_id: string; resource_type: string; resource_id: string; event: string; from_status?: string | null; to_status?: string | null; changes: Record<string, unknown>; occurred_at: string }>;
};
