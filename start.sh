# Install and start protected server and enable logging
cd protected_express_server && yarn && yarn dev > protected_express_server.log 2>&1 &

# Install and start front end
cd react_client && yarn && yarn start