export function getHomePathForRole(
  role: "school_owner" | "teacher" | "student"
) {
  switch (role) {
    case "school_owner":
      return "/schools";
    case "student":
      return "/student/dashboard";
    default:
      return "/dashboard";
  }
}
