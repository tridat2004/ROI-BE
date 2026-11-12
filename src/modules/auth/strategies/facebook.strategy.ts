import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(config: ConfigService) {
        super({
            clientID: config.getOrThrow<string>('FACEBOOK_APP_ID'),
            clientSecret: config.getOrThrow<string>('FACEBOOK_APP_SECRET'),
            callbackURL: config.getOrThrow<string>('FACEBOOK_CALLBACK_URL'),
            scope: ['email', 'public_profile'],
            profileFields: ['id', 'emails', 'name', 'displayName'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: (err: any, user?: any) => void,
    ) {
        const email = profile.emails?.[0]?.value;

        if (!email) {
            return done(
                new Error('No email from Facebook. Please allow email permission.'),
                null,
            );
        }

        done(null, {
            email,
            fullName: profile.displayName ?? `${profile.name?.givenName} ${profile.name?.familyName}`.trim() ?? email,
            provider: 'facebook'
        });
    }
}