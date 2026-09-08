export function getCurrentUser(req, res) {
  const { id, name, email, avatarUrl, freeTransformationUsed } = req.user;
  res.json({ success: true, data: { id, name, email, avatarUrl, freeTransformationUsed } });
}
