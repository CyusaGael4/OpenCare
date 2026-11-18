/** Landing route for a signed-in role. Keeps redirects consistent everywhere. */
export function roleHome(role) {
  return role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
}

export default roleHome;
