"use client";

import { useConfig } from "@/lib/useConfig";
import { PageHeader } from "@/components/PageHeader";
import { SaveBar } from "@/components/SaveBar";
import { Card, FieldGroup, TextInput, TextArea } from "@/components/ui";
import type { TicketConfig } from "@/lib/types";

export default function TicketsPage() {
  const { draft, setDraft, loading, saving, error, bridgeUnconfigured, dirty, save, data } =
    useConfig<TicketConfig>("/api/dashboard/tickets");

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Configuration for the ticket panel. Members still open, close, claim, rename and add/remove people from tickets with the existing /ticket commands — only setup/panel configuration moved here."
      />
      <SaveBar
        dirty={dirty}
        saving={saving}
        error={error}
        bridgeUnconfigured={bridgeUnconfigured}
        onSave={() => save().catch(() => {})}
        onDiscard={() => setDraft(data as TicketConfig)}
      />

      {loading && <div className="h-64 animate-pulse rounded-card bg-base-800" />}

      {draft && !loading && (
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Ticket category ID" hint="New ticket channels are created under this category.">
              <TextInput
                value={draft.categoryId ?? ""}
                onChange={(e) => setDraft({ ...draft, categoryId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
            <FieldGroup label="Support role ID" hint="Automatically added to every new ticket.">
              <TextInput
                value={draft.supportRoleId ?? ""}
                onChange={(e) => setDraft({ ...draft, supportRoleId: e.target.value || null })}
                placeholder="123456789012345678"
              />
            </FieldGroup>
            <FieldGroup label="Ticket naming pattern" hint="Supports {username} and {number}.">
              <TextInput
                value={draft.namingPattern}
                onChange={(e) => setDraft({ ...draft, namingPattern: e.target.value })}
                placeholder="ticket-{username}"
              />
            </FieldGroup>
          </div>
          <div className="mt-4">
            <FieldGroup label="Ticket panel message">
              <TextArea
                value={draft.openMessage}
                onChange={(e) => setDraft({ ...draft, openMessage: e.target.value })}
              />
            </FieldGroup>
          </div>
        </Card>
      )}
    </div>
  );
}
