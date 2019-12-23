import React from 'react';
import { withAuthenticator } from "aws-amplify-react";

const App: React.FC = () => {
  return (
    <div>
      App
    </div>
  );
}

export default withAuthenticator(App);
