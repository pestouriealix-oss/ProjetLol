"use client";

import { Search } from "lucide-react";
import Form from "next/form";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { PLATFORM_IDS, PLATFORMS, type Platform } from "@/lib/config";

const copy = t.player;

/**
 * Recherche d'un joueur par Riot ID et serveur. Le formulaire part dans
 * l'adresse (`/joueur?q=…&serveur=…`) : la page vérifie, puis ouvre le profil.
 */
export function PlayerSearchForm({
  defaultQuery,
  defaultPlatform,
  error,
  className,
}: {
  defaultQuery?: string;
  defaultPlatform: Platform;
  error?: string;
  className?: string;
}) {
  return (
    <Form
      action="/joueur"
      className={cn("grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-start", className)}
    >
      <Field id="player-q" label={copy.riotId} hint={copy.riotIdHint} error={error}>
        {(control) => (
          <Input
            {...control}
            name="q"
            type="search"
            placeholder={copy.riotIdPlaceholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={24}
            defaultValue={defaultQuery}
            required
          />
        )}
      </Field>
      <Field id="player-server" label={copy.server}>
        {(control) => (
          <Select
            {...control}
            name="serveur"
            defaultValue={PLATFORMS[defaultPlatform].short.toLowerCase()}
          >
            {PLATFORM_IDS.map((platform) => (
              <option key={platform} value={PLATFORMS[platform].short.toLowerCase()}>
                {PLATFORMS[platform].short} · {PLATFORMS[platform].label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {/* Aligné sur les champs, sous leur libellé. */}
      <Button type="submit" variant="solid" className="h-11 sm:mt-[1.625rem]">
        <Search aria-hidden />
        {copy.search}
      </Button>
    </Form>
  );
}
