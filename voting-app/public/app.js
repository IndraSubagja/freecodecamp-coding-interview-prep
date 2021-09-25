import { Login, Signup } from './Auth.js';
import Header from './components/Header.js';
import Polls from './components/Polls.js';
import MyPolls from './components/MyPolls.js';
import NewPoll from './components/NewPoll.js';

const { useState, useEffect } = React;
const { BrowserRouter: Router, Route, Switch, Redirect } = window.ReactRouterDOM;

function UnauthenticatedRoute({ user, children }) {
  return (
    <Route
      render={({ location }) =>
        user === 'Public' ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

function ProtectedRoute({ user, children }) {
  return (
    <Route
      render={({ location }) =>
        user && user !== 'Public' ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location },
            }}
          />
        )
      }
    />
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await axios.get('/api/user');
        setUser(data);
      } catch (error) {
        setUser('Public');
      }
    };

    if (user === null) {
      getUser();
    }
  }, [user]);

  return (
    user && (
      <Router>
        <Header user={user} setUser={setUser} />

        <div className="container">
          <Switch>
            <UnauthenticatedRoute user={user} path="/login">
              <Login setUser={setUser} />
            </UnauthenticatedRoute>
            <UnauthenticatedRoute user={user} path="/signup">
              <Signup setUser={setUser} />
            </UnauthenticatedRoute>

            <ProtectedRoute user={user} path="/my-polls">
              <MyPolls user={user} setUser={setUser} />
            </ProtectedRoute>
            <ProtectedRoute user={user} path="/new-poll">
              <NewPoll user={user} setUser={setUser} />
            </ProtectedRoute>
            <ProtectedRoute user={user} path="/share/:id">
              <Polls />
            </ProtectedRoute>

            <Route path="/">
              <Polls />
              <Redirect from="*" to="/" />
            </Route>
          </Switch>
        </div>
      </Router>
    )
  );
}

ReactDOM.render(<App />, document.querySelector('#root'));
