/** Known admin audit action keys emitted by `writeAdminAuditLog` */
export const ADMIN_AUDIT_ACTION_KEYS = [
  "admin.products.create",
  "admin.products.update",
  "admin.products.delete",
  "admin.products.bulk_update",
  "admin.orders.update",
  "admin.returns.create",
  "admin.returns.update",
  "admin.promo.create",
  "admin.promo.update",
  "admin.promo.delete",
  "admin.campaign.create",
  "admin.campaign.update",
  "admin.campaign.delete",
  "admin.posts.create",
  "admin.posts.update",
  "admin.posts.delete",
  "admin.media.upload",
  "admin.media.delete",
  "admin.users.update",
  "admin.site-settings.update",
] as const;

export type AdminAuditActionKey = (typeof ADMIN_AUDIT_ACTION_KEYS)[number];

/** Known entity types stored on audit rows */
export const ADMIN_AUDIT_ENTITY_KEYS = [
  "product",
  "order",
  "order_return",
  "promo_code",
  "discount_campaign",
  "post",
  "media",
  "user",
  "site_settings",
] as const;

export type AdminAuditEntityKey = (typeof ADMIN_AUDIT_ENTITY_KEYS)[number];
