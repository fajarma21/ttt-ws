import 'dotenv/config';

import wsConfigure from './socket';
import { wsVerification } from './index.helpers';

const PORT = 8000;

wsConfigure(PORT, wsVerification);
