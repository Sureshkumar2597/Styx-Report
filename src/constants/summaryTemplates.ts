export const SummaryTemplates = {
  employees(count: number, isRevealed: boolean) {
    return `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
      ${count} employee credential${count === 1 ? "" : "s"}
    </span> found circulating on stealer log marketplaces.`;
  },

  users(count: number, isRevealed: boolean) {
    return `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
      ${count} customer/user credential${count === 1 ? "" : "s"}
    </span> exposed alongside this domain.`;
  },

  employeeUrls(count: number, isRevealed: boolean) {
    return `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
      ${count} employee-linked login URL${count === 1 ? "" : "s"}
    </span> discovered in breach data.`;
  },

  thirdPartyUrls(count: number, isRevealed: boolean) {
    return `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
      ${count} third-party service URL${count === 1 ? "" : "s"}
    </span> tied to this domain found exposed.`;
  },

  userUrls(count: number, isRevealed: boolean) {
    return `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
      ${count} user-facing URL${count === 1 ? "" : "s"}
    </span> discovered in the same breach data.`;
  },

  sensitiveApps(count: number, isRevealed: boolean) {
    return count > 0
      ? `<span class="${isRevealed ? "blur-text revealed" : "blur-text"}">
          ${count} sensitive internal application${count === 1 ? "" : "s"}
        </span> flagged as accessed by compromised machines.`
      : `No sensitive internal applications flagged by compromised machines at this time.`;
  },
};
