import { useCallback, useEffect, useState } from 'react';
import { GithubLoginButton } from 'react-social-login-buttons';
import axios from 'axios';
import Masonry from 'masonry-layout';

import './App.css';

axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.headers.common['Access-Control-Allow-Origin'] = 'http://localhost:8000';

function App() {
  const [dropdown, setDropdown] = useState(false);
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [pics, setPics] = useState(null);
  const [msnry, setMsnry] = useState(null);

  const getPics = useCallback(async (query) => {
    const { data } = await axios.get('/pic', query ? { params: { userId: query } } : {});
    setPics(data);
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();

    try {
      await axios.post('/pic', {
        url,
        description: description || `a pic by @${user.login}`,
        uploader: user.login,
        avatar: user.avatar_url,
        userId: user.id,
      });
      await getPics();
      dropdownHandler();
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteHandler = async (picId) => {
    try {
      await axios.delete('/pic', { data: { picId } });
      await getPics();
    } catch (error) {
      console.log(error.message);
    }
  };

  const starHandler = async (picId, userId) => {
    try {
      await axios.put('/pic', { picId, userId });
      await getPics();
    } catch (error) {
      console.log(error.message);
    }
  };

  const dropdownHandler = () => {
    setDropdown(false);
    setUrl('');
    setDescription('');
  };

  useEffect(() => {
    const handleDropdown = (event) => {
      if (dropdown && event.target.id !== 'dropdown') {
        dropdownHandler();
      }
    };
    document.body.addEventListener('click', handleDropdown);

    return () => document.body.removeEventListener('click', handleDropdown);
  }, [dropdown]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await axios.get('/user', { withCredentials: true });

        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.log(error.message);
      }
    };

    if (!user) {
      getUser();
    }
  }, [user]);

  useEffect(() => {
    if (!pics) {
      getPics();
    } else {
      const newMsnry = new Masonry(document.querySelector('.grid'), {
        itemSelector: '.grid-item',
        columnWidth: 200,
        percentPosition: true,
        fitWidth: true,
        gutter: 10,
      });
      setMsnry(newMsnry);
    }
  }, [getPics, pics]);

  useEffect(() => {
    if (msnry) {
      msnry.layout();
    }
  }, [msnry]);

  return (
    <div>
      <nav>
        <button type="button" onClick={() => getPics()}>
          Pinterest Clone
        </button>

        <ul>
          <li>
            <button type="button" className="nav-btn" onClick={() => getPics()}>
              All
            </button>
          </li>
          {user && (
            <>
              <li>
                <button type="button" className="nav-btn" onClick={() => getPics(user?.id)}>
                  My Pics
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => (!dropdown ? setDropdown(true) : dropdownHandler())}
                  id="dropdown"
                >
                  Add Pic <span>&#9660;</span>
                </button>
                {dropdown && (
                  <div className="dropdown" onClick={(event) => event.stopPropagation()}>
                    <form onSubmit={submitHandler}>
                      <input
                        type="text"
                        name="url"
                        id="url"
                        placeholder="Image URL"
                        required
                        onChange={(event) => setUrl(event.target.value)}
                      />
                      <input
                        type="text"
                        name="description"
                        id="description"
                        placeholder="Description"
                        onChange={(event) => setDescription(event.target.value)}
                      />
                      <button type="submit">Send</button>
                    </form>
                  </div>
                )}
              </li>
            </>
          )}
        </ul>

        {user ? (
          <button
            type="button"
            className="nav-btn"
            onClick={async () => {
              await axios.get('/logout', { withCredentials: true });
              setUser(null);
              getPics();
            }}
          >
            Logout
          </button>
        ) : (
          <GithubLoginButton
            onClick={async () => {
              const { data } = await axios.get('/client-id');
              const redirectUri = 'http://localhost:8000/login';

              document.location.href = `https://github.com/login/oauth/authorize?client_id=${data.CLIENT_ID}&redirect_uri=${redirectUri}`;
            }}
            iconSize="2rem"
            style={{
              width: 'max-content',
              height: '3.2rem',
              fontSize: '1.6rem',
              margin: '0 0 0 auto',
              borderRadius: '0.5rem',
            }}
          />
        )}
      </nav>

      <main>
        {pics && (
          <div className="grid">
            <div className="grid-sizer"></div>
            {pics.map((pic) => (
              <div className="grid-item" key={pic._id}>
                <img
                  src={pic.url}
                  onError={(event) => {
                    event.target.src =
                      'https://iplbi.or.id/wp-content/plugins/pl-platform/engine/ui/images/image-preview.png';
                    msnry.layout();
                  }}
                  alt=""
                />
                <div className="description">
                  <p>{pic.description}</p>
                </div>
                <div className="details">
                  <button type="button" className="avatar" onClick={() => getPics(pic.userId)}>
                    <img src={pic.avatar} alt={pic.uploader} />
                  </button>
                  {pic.userId === user?.id && (
                    <button type="button" className="remove-btn" onClick={() => deleteHandler(pic._id)}>
                      &#10006;
                    </button>
                  )}
                  <button type="button" className="star" onClick={() => starHandler(pic._id, user?.id)}>
                    <span className={pic.stars.find((id) => id === user?.id) ? 'active' : ''}>&#9733;</span>
                    <span>{pic.stars.length}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
