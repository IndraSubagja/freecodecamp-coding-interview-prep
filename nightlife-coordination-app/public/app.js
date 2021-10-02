const { Fragment, useState, useEffect, useCallback } = React;

function Rating({ rating, totalReviews }) {
  const star = (num) => (rating >= num ? 'fas fa-star' : rating >= num - 0.5 ? 'fas fa-star-half-alt' : 'far fa-star');

  return (
    <div className="rating">
      <span>
        <i className={star(1)}></i>
      </span>
      <span>
        <i className={star(2)}></i>
      </span>
      <span>
        <i className={star(3)}></i>
      </span>
      <span>
        <i className={star(4)}></i>
      </span>
      <span>
        <i className={star(5)}></i>
      </span>

      <span>({totalReviews} Reviews)</span>
    </div>
  );
}

function Location({ user, business, destination, addHandler, removeHandler }) {
  return (
    <li key={business.id}>
      <img src={business.image_url} alt={business.name} />
      <div>
        <h2>{business.name}</h2>
        <Rating rating={business.rating} totalReviews={business.review_count} />
        <p>
          <strong>Address:</strong> {business.location.display_address.join(', ')}
        </p>
        {business.display_phone && (
          <h3>
            <span>
              <i className="fas fa-phone"></i>
            </span>{' '}
            {business.display_phone}
          </h3>
        )}
      </div>

      <a href={business.url} target="_blank">
        <span>
          <i className="fas fa-external-link-alt"></i>
        </span>
      </a>

      {user &&
        user !== 'Public' &&
        (destination && destination.find((d) => d.id === business.id) ? (
          <button type="button" onClick={() => removeHandler(destination.find((d) => d.id === business.id)._id)}>
            <i className="fas fa-trash-alt"></i>
          </button>
        ) : (
          <button type="button" onClick={() => addHandler(business)}>
            <i className="fas fa-plus"></i>
          </button>
        ))}

      <h4 className={business.is_closed ? 'text-danger' : 'text-success'}>{business.is_closed ? 'Closed' : 'Open'}</h4>
    </li>
  );
}

function Locations({ user, result, destination, addHandler, removeHandler }) {
  const filterConfig = JSON.parse(localStorage.getItem('filter-config'));
  return (
    <Fragment>
      <h1>Nightlife in {filterConfig && filterConfig.place ? filterConfig.place : 'Your Nearby'}</h1>
      <ul className="location-list">
        {result.businesses && result.businesses.length ? (
          result.businesses.map((business) => (
            <Location
              user={user}
              business={business}
              destination={destination}
              addHandler={addHandler}
              removeHandler={removeHandler}
            />
          ))
        ) : (
          <p>Sorry, we can't find anything</p>
        )}
      </ul>
    </Fragment>
  );
}

function Destinations({ user, result, destination, addHandler, removeHandler }) {
  return (
    <Fragment>
      <h1>My Destination</h1>
      <ul className="location-list">
        {result.businesses && result.businesses.length ? (
          result.businesses.map((business) => (
            <Location
              user={user}
              business={business}
              destination={destination}
              addHandler={addHandler}
              removeHandler={removeHandler}
            />
          ))
        ) : (
          <p>You currently don't have any destination</p>
        )}
      </ul>
    </Fragment>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [place, setPlace] = useState(null);
  const [sort, setSort] = useState(null);
  const [open, setOpen] = useState(null);
  const [destination, setDestination] = useState(null);
  const [result, setResult] = useState(null);

  const loginHandler = async () => {
    const {
      data: { clientId },
    } = await axios.get('/api/client-id');
    const redirectUri = 'http://localhost:8000/api/login';

    document.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  const logoutHandler = async () => {
    localStorage.setItem('path', 'search');

    try {
      const { data } = await axios.get('/api/logout');
      setUser(data);
    } catch (error) {
      console.log(error);
    }
  };

  const searchHandler = useCallback(
    async (event) => {
      event && event.preventDefault();

      localStorage.setItem('filter-config', JSON.stringify({ place, open, sort }));
      localStorage.setItem('path', 'search');

      try {
        if (place === '') {
          navigator.geolocation.getCurrentPosition(async (position) => {
            const { data } = await axios.get('/api/place', {
              params: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                open_now: open,
                sort_by: sort,
              },
            });
            setResult(data);
          });
        } else if (place) {
          const { data } = await axios.get('/api/place', {
            params: { location: place, open_now: open, sort_by: sort },
          });
          setResult(data);
        }
      } catch (error) {
        setResult([1, 2, 3]);
      }
    },
    [place, open, sort]
  );

  const addHandler = async (business) => {
    try {
      const { data } = await axios.post('/api/destination', { ...business, userId: user.id });
      setDestination(destination.concat([data.destination]));
      alert(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const removeHandler = async (id) => {
    try {
      const { data } = await axios.delete('/api/destination', { data: { id } });
      setDestination(destination.filter((d) => d._id !== id));
      alert(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  const homeHandler = () => {
    setPlace(null);
    setSort(null);
    setOpen(null);
    setResult(null);

    localStorage.removeItem('filter-config');
    localStorage.setItem('path', 'search');
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await axios.get('/api/user');
        setUser(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user === null) {
      getUser();
    }
  }, [user]);

  useEffect(() => {
    const getDestination = async () => {
      try {
        const { data } = await axios.get('/api/destination', { params: { userId: user.id } });
        setDestination(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user && user !== 'Public' && !destination) {
      getDestination();
    }
  }, [user, destination]);

  useEffect(() => {
    if (!place && !sort && !open) {
      let filterConfig = JSON.parse(localStorage.getItem('filter-config')) || null;

      if (!filterConfig) {
        filterConfig = { place: '', open: false, sort: 'best_match' };
        localStorage.setItem('filter-config', JSON.stringify(filterConfig));
      }

      setPlace(filterConfig.place);
      setOpen(filterConfig.open);
      setSort(filterConfig.sort);
    } else if (!result) {
      searchHandler();
    }
  }, [searchHandler, place, sort, open, result]);

  useEffect(() => {
    const hideDropdown = (event) => {
      if (!event.target.classList.contains('dropdown') && dropdown) {
        setDropdown(false);
      }
    };

    document.addEventListener('click', hideDropdown);

    return () => document.removeEventListener('click', hideDropdown);
  }, [dropdown]);

  useEffect(() => {
    const hideModal = (event) => {
      if (event.target.classList.contains('modal') && modal) {
        setModal(false);
      }
    };

    document.addEventListener('click', hideModal);

    return () => document.removeEventListener('click', hideModal);
  }, [modal]);

  return (
    user && (
      <Fragment>
        <header>
          <nav>
            <ul>
              <li>
                <button type="button" onClick={homeHandler}>
                  Nightlife Coordination App
                </button>
              </li>
              <li>
                <form onSubmit={searchHandler}>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    placeholder="Enter location"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                  />
                  <button type="button" onClick={() => setModal(true)}>
                    <i className="fas fa-filter"></i>
                  </button>
                  <button type="submit">
                    <i className="fas fa-search"></i>
                  </button>
                </form>
              </li>
              <li>
                {user === 'Public' ? (
                  <button type="button" className="btn-github" onClick={loginHandler}>
                    <i className="fa fa-github"></i> Sign in with Github
                  </button>
                ) : (
                  <button type="button" className="dropdown" onClick={() => setDropdown(!dropdown)}>
                    {user.login}{' '}
                    <span>
                      <i className="fas fa-caret-down"></i>
                    </span>
                    {dropdown && (
                      <aside>
                        <button type="button" onClick={() => localStorage.setItem('path', 'destination')}>
                          My Destination
                        </button>
                        <button type="button" onClick={logoutHandler}>
                          Logout
                        </button>
                      </aside>
                    )}
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </header>

        <main>
          {result &&
            (localStorage.getItem('path') === 'destination' ? (
              <Destinations
                user={user}
                result={{ businesses: destination }}
                destination={destination}
                addHandler={addHandler}
                removeHandler={removeHandler}
              />
            ) : (
              <Locations
                user={user}
                result={result}
                destination={destination}
                addHandler={addHandler}
                removeHandler={removeHandler}
              />
            ))}
        </main>

        <footer>
          <h4>
            <a href="https://www.yelp.com/" target="_blank">
              Yelp API
            </a>
          </h4>
        </footer>

        {modal && (
          <aside className="modal">
            <div>
              <button onClick={() => setModal(false)}>
                <i className="fas fa-times"></i>
              </button>

              <form
                onSubmit={(event) => {
                  searchHandler(event);
                  setModal(false);
                }}
              >
                <h1>Filters</h1>
                <div className="input-control">
                  <label htmlFor="open">Show currently open places only</label>
                  <input
                    type="checkbox"
                    name="open"
                    id="open"
                    defaultChecked={open}
                    onChange={(event) => setOpen(event.target.checked)}
                  />
                </div>
                <div className="input-control">
                  <label htmlFor="sort">Sort by</label>
                  <select name="sort" id="sort" defaultValue={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="best_match" selected>
                      Best Match
                    </option>
                    <option value="rating">Rating</option>
                    <option value="review_count">Total Reviews</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>

                <div className="buttons">
                  <button type="button" onClick={() => setModal(false)}>
                    Cancel
                  </button>
                  <button type="submit">Confirm</button>
                </div>
              </form>
            </div>
          </aside>
        )}
      </Fragment>
    )
  );
}

ReactDOM.render(<App />, document.querySelector('#root'));
