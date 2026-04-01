import React from 'react';

const AlertNotificationBadge = ({ count = 0 }) => (
  <div className="alert-badge" aria-hidden>
    {count > 0 ? <span className="badge">{count}</span> : null}
  </div>
);

export default AlertNotificationBadge;
