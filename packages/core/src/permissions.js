// Sama persis dengan src/lib/permissions.js (atau sesuai instruksi)
// Digunakan oleh Electron DAN mobile

const PERMISSIONS = {
    'kasir:view'         : ['owner','manager','kasir'],
    'kasir:checkout'     : ['owner','manager','kasir'],
    'kasir:void'         : ['owner','manager'],
    'kasir:hold_bill'    : ['owner','manager','kasir'],
    'kasir:open_session' : ['owner','manager','kasir'],
    'kasir:close_session': ['owner','manager','kasir'],
    'inventory:view'     : ['owner','manager','kasir'],
    'inventory:edit'     : ['owner','manager'],
    'inventory:delete'   : ['owner'],
    'accounting:view'    : ['owner','manager'],
    'accounting:export'  : ['owner','manager'],
    'tax:view'           : ['owner'],
    'supplier:view'      : ['owner','manager'],
    'supplier:edit'      : ['owner','manager'],
    'supplier:pay'       : ['owner'],
    'receivable:view'    : ['owner','manager','kasir'],
    'receivable:record'  : ['owner','manager','kasir'],
    'receivable:void'    : ['owner','manager'],
    'users:view'         : ['owner','manager'],
    'users:create'       : ['owner'],
    'users:edit'         : ['owner'],
    'users:deactivate'   : ['owner'],
    'audit:view'         : ['owner','manager'],
    'settings:view'      : ['owner','manager'],
    'settings:edit'      : ['owner'],
    'fnb:view_orders'    : ['owner','manager','kasir','chef'],
    'fnb:create_order'   : ['owner','manager','kasir'],
    'fnb:void_order'     : ['owner','manager'],
    'fnb:mark_ready'     : ['owner','manager','chef'],
    'fnb:manage_tables'  : ['owner','manager','kasir'],
    'fnb:manage_recipes' : ['owner','manager'],
};

function hasPermission(role, permission) {
    const allowed = PERMISSIONS[permission];
    if (!allowed) return false;
    return allowed.includes(role);
}

function canAccess(role, permissions) {
    return permissions.every(p => hasPermission(role, p));
}

module.exports = { PERMISSIONS, hasPermission, canAccess };
