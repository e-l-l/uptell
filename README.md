# uptell

## Environment Variables

### Backend

- `ENABLE_EMAIL_NOTIFICATIONS` (default: `false`) - Set to `"true"` to enable email notifications for organization events. When disabled, webhook/websocket notifications will still function normally, but no emails will be sent.

## Usage

To enable email notifications:

```bash
export ENABLE_EMAIL_NOTIFICATIONS=true
```

To disable email notifications (default):

```bash
export ENABLE_EMAIL_NOTIFICATIONS=false
# or simply don't set the variable
```
