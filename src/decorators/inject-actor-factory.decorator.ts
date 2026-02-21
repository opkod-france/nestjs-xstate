import { Inject } from '@nestjs/common';
import { getActorFactoryToken } from '../constants';

export const InjectActorFactory = (name: string): ParameterDecorator =>
  Inject(getActorFactoryToken(name));
