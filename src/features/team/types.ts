/** `GET /admin/team/getTeam` — AdminTeamService.getTeam. */
export interface TeamAdmin {
  id: string;
  name: string;
  phone: string;
  since: string | null;
  isYou: boolean;
}

export interface TeamInvite {
  id: string;
  name: string;
  phone: string;
  invitedBy: string;
  createdAt: string | null;
}

export interface Team {
  admins: TeamAdmin[];
  invites: TeamInvite[];
}
