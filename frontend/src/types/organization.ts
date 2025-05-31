export interface UserOrganization {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "member";
}

export interface OrganizationMember extends UserOrganization {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}
