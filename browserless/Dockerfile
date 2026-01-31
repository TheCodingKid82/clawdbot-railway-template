FROM browserless/chrome:latest

USER root

# Create entrypoint script that fixes permissions before starting
RUN echo '#!/bin/bash\n\
if [ -d "/data" ]; then\n\
  chown -R blessuser:blessuser /data 2>/dev/null || true\n\
  chmod -R 755 /data 2>/dev/null || true\n\
fi\n\
exec su blessuser -c "/usr/bin/dumb-init -- /usr/local/bin/start.sh $@"' > /entrypoint.sh \
    && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
