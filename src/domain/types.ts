

// Este archivo contendrá las definiciones de tipos y entidades centrales de nuestro dominio.
// Por ejemplo, cómo se vea un Proyecto o una Tarea, independientemente de la base de datos.

export type LoanUser = {
    id: string;
    name: string;
    role: 'Docente' | 'Admin';
    dni?: string;
    email?: string;
};

export type ResourceStatus = 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';

export type Resource = {
    id: string;
    name: string; // "Laptop 1", "Cámara 5" - generado automáticamente
    brand?: string;
    model?: string;
    status: ResourceStatus;
    condition?: 'bueno' | 'regular' | 'malo';
    stock: number;
    damageNotes?: string;
    category?: string;
    attributes?: { [key: string]: string };
    notes?: string;
    // Nuevos campos para accesorios relacionados
    relatedAccessories?: string[]; // IDs de accesorios que pueden ir con este recurso
    isAccessory?: boolean; // Indica si este recurso es un accesorio
    compatibleWith?: string[]; // IDs de recursos principales con los que es compatible (para accesorios)
}

export type Category = {
    id: string;
    name: string;
    resources: Resource[];
}

export type DamageReport = {
    commonProblems: string[];
    otherNotes: string;
}

export type SuggestionReport = {
    commonSuggestions: string[];
    otherNotes: string;
}

export type MissingResourceReport = {
    resourceId: string;
    resourceName: string;
    resourceBrand?: string;
    reportDate: Date;
    notes?: string;
}

export type Loan = {
    id: string;
    user: LoanUser;
    purpose: 'aprendizaje' | 'institucional';
    purposeDetails?: {
        area?: string;
        grade?: string;
        section?: string;
        activityName?: string;
        timeSlot?: string; // Store the time slot for proper calendar display
    };
    loanDate: Date;
    returnDate?: Date;
    status: 'active' | 'returned' | 'pending' | 'rejected';
    resources: Pick<Resource, 'id' | 'name' | 'brand'>[];
    damageReports?: Record<string, DamageReport>;
    suggestionReports?: Record<string, SuggestionReport>;
    missingResources?: MissingResourceReport[];
}

export type ReservationStatus = 'Confirmada' | 'Realizada' | 'No asistió' | 'Cancelada';

export type Reservation = {
    id: string;
    user: LoanUser;
    user_id?: string; // For compatibility with database operations
    purpose: 'aprendizaje' | 'institucional';
    purposeDetails?: {
        area?: string;
        grade?: string;
        section?: string;
        activityName?: string;
        timeSlot?: string; // Store the time slot for proper calendar display
    };
    startTime: Date;
    endTime: Date;
    status: ReservationStatus;
}

export type AgreementTask = {
    id: string;
    description: string;
    responsibleId: string; // Corresponds to LoanUser.id
    status: 'pending' | 'completed';
    notes?: string;
};

export type GenericParticipant = 'director' | 'subdirector' | 'coordinadores' | 'docentes' | 'otros';

export type Meeting = {
    id: string;
    title: string;
    date: Date;
    participants: LoanUser[];
    genericParticipants: GenericParticipant[];
    colegiadoAreas?: string[];
    otherParticipants?: string;
    tasks: AgreementTask[];
};

export type Section = {
  id: string;
  name: string; 
  grade_id: string;
};

export type Grade = {
  id: string;
  name: string;
  sections: Section[];
};

export type Area = {
    id: string;
    name: string;
};

export type PedagogicalHour = {
    id: string;
    name: string | Record<string, string>;
};

export type GradeSectionFormData = {
  names: string[];
}
